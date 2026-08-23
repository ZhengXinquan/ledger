# MongoDB → Cloudflare D1 数据迁移方案

目标：把 MongoDB（库名 `hdm189315162_db`，连接见 `api/class/utils.js`）的数据导出，转换为可导入 Cloudflare D1（SQLite）的 SQL 文件。

## 0. 集合 → 表 对照

| MongoDB 集合 | D1 表 | 说明 |
| --- | --- | --- |
| aa_big_type | aa_big_type | 大类 |
| aa_small_type | aa_small_type | 小类，`_bid` 关联大类 |
| aa_income | aa_income | 收入，`_bid` 关联大类 |
| aa_pay_budget | aa_pay_budget | 预算，`_sid` 关联小类 |
| aa_account_book | aa_account_book | 支出明细，`_sid` 关联小类 |
| aa_log | aa_log | 操作日志，数据量可能巨大；默认不导出（`--with-log` 才导出） |

## 1. BSON → SQLite 类型映射

| MongoDB (BSON) | D1 (SQLite) | 转换方式 |
| --- | --- | --- |
| ObjectId（`_id`/`_bid`/`_sid`/`tid`） | TEXT | `obj.toString()` 十六进制字符串；`_id` 作主键 |
| Date（`_aday`/`_atime`/`_iday`/`_itime`/`_pmonth`/`time`） | TEXT | `d.toISOString()`（UTC ISO8601），查询时用 `strftime('%Y-%m', _aday, '+8 hours')` 换算北京时间 |
| Number 整数 | INTEGER | `Number(v)` |
| Number 小数 | REAL | `Number(v)` |
| String | TEXT | 单引号包裹，内单引号 `'` 转义为 `''` |
| 嵌套对象/数组（如 `aa_log.d`） | TEXT | `JSON.stringify(v)` |

## 2. D1 建表 SQL

表结构由 `exportD1.js` **动态生成**：列 = 该集合所有文档的实际字段并集（`_id` 移到首位并作主键），类型按值自动推断（全整数 → INTEGER、含小数 → REAL、日期/字符串/对象 → TEXT）。因此数据里历史遗留的额外字段（如 `aa_account_book` 的 `id`、`aday_`）也会被完整保留，不会丢列。

以下为基础字段示意（脚本实际输出以此为准，可能多出上述遗留列）：

```sql
CREATE TABLE IF NOT EXISTS aa_big_type (
  _id TEXT PRIMARY KEY,
  bname TEXT,
  btype INTEGER,
  bshow INTEGER,
  bpx INTEGER
);

CREATE TABLE IF NOT EXISTS aa_small_type (
  _id TEXT PRIMARY KEY,
  sname TEXT,
  _bid TEXT,
  sshow INTEGER,
  spx INTEGER
);

CREATE TABLE IF NOT EXISTS aa_income (
  _id TEXT PRIMARY KEY,
  bid TEXT,
  _bid TEXT,
  iname TEXT,
  imoney REAL,
  iday TEXT,
  _iday TEXT,
  _itime TEXT
);

CREATE TABLE IF NOT EXISTS aa_pay_budget (
  _id TEXT PRIMARY KEY,
  sid TEXT,
  _sid TEXT,
  pmoney REAL,
  pmonth TEXT,
  _pmonth TEXT,
  _ptime TEXT
);

CREATE TABLE IF NOT EXISTS aa_account_book (
  _id TEXT PRIMARY KEY,
  sid TEXT,
  _sid TEXT,
  aname TEXT,
  amoney REAL,
  aday TEXT,
  _aday TEXT,
  atime TEXT,
  _atime TEXT,
  cid INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS aa_log (
  _id TEXT PRIMARY KEY,
  title TEXT,
  tid TEXT,
  d TEXT,
  time TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_book_sid ON aa_account_book(_sid);
CREATE INDEX IF NOT EXISTS idx_account_book_aday ON aa_account_book(_aday);
CREATE INDEX IF NOT EXISTS idx_small_type_bid ON aa_small_type(_bid);
CREATE INDEX IF NOT EXISTS idx_income_bid ON aa_income(_bid);
CREATE INDEX IF NOT EXISTS idx_pay_budget_sid ON aa_pay_budget(_sid);
```

## 3. 导出 & 转换（已实现）

脚本 `exportD1.js`（仓库根目录）已实现并实测可用：

```bash
# 默认：导出 5 个业务表 → ./d1-export.sql
node exportD1.js

# 指定输出文件
node exportD1.js d1-export.sql

# 额外导出 aa_log（该集合数据量巨大，全量读取耗时较长，谨慎）
node exportD1.js --with-log
```

脚本行为：

1. 复用 `api/class/utils.js` 的 `client()` 建立连接，**只读**：仅 `collection.find({}).toArray()`，不含任何增删改；
2. 按第 1 节的映射规则递归转换 BSON → SQLite 值（`ObjectId` → hex 文本、`Date` → UTC ISO 字符串、嵌套对象 → JSON、`Long/Int32/Double` → 数字）；
3. 动态建表（见第 2 节）+ 逐行生成 `INSERT INTO 表 (列...) VALUES (...);`；
4. 流式落盘。**注意：D1 不支持 SQL 层的 `BEGIN`/`COMMIT`/`SAVEPOINT` 事务语句（实测 wrangler 会直接报错拒绝），故生成文件不再包裹事务**，全部为逐条普通语句；若导入中途失败，需先清理再整体重导。

实测（2026-08）导出记录数：

| 表 | 行数 |
| --- | --- |
| aa_big_type | 27 |
| aa_small_type | 49 |
| aa_income | 108 |
| aa_pay_budget | 2494 |
| aa_account_book | 12609 |

已将 `d1-export.sql` 用 `sqlite3` 实测导入验证通过（表、行数、数据均可正确查询）。

备选方式：

- `mongodump` / `mongoexport` 把集合导出为 JSON（`mongoexport --db hdm189315162_db --collection aa_account_book --out aa_account_book.json`），再用同一套映射规则转 SQL；
- 第三方工具把 MongoDB 直接转成 SQLite 二进制文件，再用 `wrangler d1 execute --file=xxx.sqlite` 导入。

## 4. 导入 D1

仓库已配置 `wrangler.toml`（含 `ledger-db` 的 D1 绑定，`database_id` 已填真实值）和 `worker.js`（已实现只读查询接口，见第 6 节）。已用 wrangler 4.125.0 **本地模式实测导入并验证通过**：

```bash
# 本地预览（无需 Cloudflare 账号，数据落在 .wrangler/state/v3/d1/）
npx wrangler d1 execute ledger-db --local --file=./d1-export.sql

# 本地查询验证
npx wrangler d1 execute ledger-db --local --command="SELECT COUNT(*) FROM aa_account_book;"
```

实测：5 张业务表全部建成，行数与第 3 节一致（27 / 49 / 108 / 2494 / 12609），金额、日期、中文名均可正确查询。

生产环境导入：

```bash
# 建库并拿到真实 database_id（一次性）
npx wrangler d1 create ledger-db
# 把返回的 database_id 填入 wrangler.toml 的 [[d1_databases]]

# 远程导入
npx wrangler d1 execute ledger-db --remote --file=./d1-export.sql
# 线上验证
npx wrangler d1 execute ledger-db --remote --command="SELECT COUNT(*) FROM aa_account_book;"
```

> 提示：`--local` 使用本地持久化的 SQLite 文件，若此前有中断的导入留下锁，可先 `rm -rf .wrangler/state/v3/d1` 再重试。

## 5. 注意事项

- D1 中表已存在时，先 `DROP TABLE` 或改用 `INSERT OR REPLACE`；
- **D1 不支持 SQL 层的 `BEGIN`/`COMMIT`/`SAVEPOINT` 事务语句**，导入文件不要包含它们；
- `aa_log` 只是日志，默认不导出；确实需要可 `--with-log`（数据量巨大，需评估 D1 限制）；
- 日期统一按北京时间（+0800）换算，与现有 api 聚合逻辑保持一致；
- wrangler 对大 SQL 文件有上传大小限制，本个人记账应用数据量小，一次导入即可；若文件超大需分批导入。

## 6. Worker + D1 查询接口（已实现）

`worker.js` 已把 `api/*.js`（Vercel）→ `api/class/*.js`（MongoDB）的**只读查询**逻辑迁移为 Cloudflare Workers + D1（binding 名 `ledger_db`，即 `env.ledger_db`）。

### 请求格式（与前端保持兼容）

前端 `src/components/utils.js` 的 `http()` 会向 `/api/<module>` 发 `application/x-www-form-urlencoded` 的 POST，请求体含 `info` 标识操作；本 Worker 直接兼容该协议，返回格式沿用 `{ tip, d, msg }`。

已迁移的接口清单：

| 模块（路径） | info | 参数 | 对应原 class 方法 |
| --- | --- | --- | --- |
| `/api/accountBook` | `selectBillByYear` | `year` | `selectBillByYear` |
| `/api/accountBook` | `selectPayDetailBySidAndTime` | `id`(小类 `_id`)、`d`(时间)、`t`(`week`/`month`/`year`) | `selectPayDetailBySidAndTime` |
| `/api/accountBook` | `selectPayDetailByTime` | `d`(时间)、`t`(`week`/`month`/`year`) | `selectPayDetailByTime` |
| `/api/accountBook` | `select_by_month` | `month`(`YYYY-MM`) | `select`（当月收入+支出合并） |
| `/api/accountBook` | `search` | `st`、`et`、`n`、`bn`、`sn` | `search` |
| `/api/bigType` | `select_income` / `select_pay` / `select_all_income` / `select_all_pay` | 无 | `select` / `selectAll` |
| `/api/smallType` | `select_income` / `select_pay` / `select_all_income` / `select_all_pay` | 无 | `select` / `selectAll` |
| `/api/payBudget` | `select_by_month` | `month`(`YYYY-MM`) | `select` |

未迁移：`income` 模块（原只有写操作）以及各模块的 `insert` / `delete` / `update_detail` / `update_type` / `update_name` / `update_px` / `show` / `hide` / `px` / `copy_by_month` 等**写操作**（需要 MongoDB 双写时再演进）。这些请求会返回 `{ tip: 0, d: [], msg: 'api/<module>.js : <info>  err' }`，与原默认分支行为一致。

### SQL 实现要点

- 时间口径与 Mongo 聚合对齐：月/年用 `strftime('%Y-%m' / '%Y', 列名, '+8 hours')`（北京时间）；周用 `strftime('%G'/%V)`（ISO 年/周），等价 Mongo 的 `$year/$month/$isoWeekYear/$isoWeek`（timezone `+0800`）。
- 明细类接口通过 `JOIN` 还原 Mongo 的 `$lookup`：支出按 `aa_account_book._sid → aa_small_type._id`、`aa_small_type._bid → aa_big_type._id`；收入按 `aa_income._bid → aa_big_type._id`。
- `selectBillByYear` 对支出/收入/预算分别按月 `GROUP BY` 汇总后在 JS 侧合并（月度取三表月份的并集，比原“仅按支出分组”更完整）；`lincome`/`lbudget` 与全年合计逻辑与原实现一致。
- `search` 用 `LIKE ? COLLATE BINARY`（大小写敏感，贴近 Mongo `$regex`），日期范围用 UTC 边界（与原 Vercel 服务器时区 `new Date('YYYY-MM-DD 00:00:00')` 语义一致）。
- `payBudget.select_by_month`：先按月分组小类实际支出做子查询，再 `LEFT JOIN` 到预算表，`COALESCE(..., 0)` 处理无支出的小类，并补 `lm`（结余）。
- 排序、字段别名（`n`/`m`/`d`/`t`/`tid`/`bn`/`sn`/`pm`/`lm` 等）均按原 `$project`/`$sort` 还原。

### 本地验证

```bash
# 起本地预览（需先完成第 4 节的本地导入）
npx wrangler dev --port 8787 --local

# 联调示例
curl -s -X POST http://127.0.0.1:8787/api/accountBook \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'info=selectBillByYear&year=2023'
curl -s -X POST http://127.0.0.1:8787/api/payBudget \
  -d 'info=select_by_month&month=2020-10'
```

输出结果与本地 SQLite 数据完全一致（端到端已用 wrangler dev 实测）。