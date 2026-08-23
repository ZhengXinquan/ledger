# 本地开发 / 运行（Local Development）

本地整套环境由 **Vite（前端开发服务器）+ Wrangler（Pages Functions + 本地 D1 模拟）** 组成。

## 1. 环境准备

- Node.js ≥ 18（建议 20/22 LTS）
- npm（随 Node 自带）
- 无需 Cloudflare 账号也能完成全部本地开发（D1 使用本地模拟）

```bash
# 安装依赖（含 wrangler）
npm install
```

> `.dev.vars` 文件（如有）放本地敏感变量；本项目无需额外本地变量。

## 2. 一次性初始化：本地 D1

本地 D1 状态存放在 `.wrangler/`（已 gitignore），首次运行前可选执行：

```bash
# 方式一：只建表（空库开始，适合开发人员用空数据自测）
npm run db:local-init

# 方式二：建表 + 灌入历史数据（原 MongoDB 导出的全量数据，可直接看到真实效果）
npm run db:local-seed
```

对应脚本：

| 脚本 | 等价命令 |
| --- | --- |
| `db:local-init` | `wrangler d1 execute ledger-db --local --file=migrations/schema.sql` |
| `db:local-seed` | `wrangler d1 execute ledger-db --local --file=migrations/seed.sql` |

> 重置本地库：删除 `rm -rf .wrangler/state`（需先停止 `wrangler pages dev`），再重跑上面的初始化命令。

## 3. 启动后端（Pages Functions + 静态服务）

```bash
npm run pages:dev
# 等价于：wrangler pages dev
# 读取 wrangler.toml 中的 pages_build_output_dir = "dist" 与 d1_databases
```

- 访问 `http://127.0.0.1:8788`：同源提供静态页面 + `/api/*` Functions。
- 注意：默认要求 `dist/` 已构建（`npm run build`）。如未构建，先执行构建。

## 4. 启动前端（推荐 Vite 开发服务器）

终端 1（后端）：

```bash
npm run pages:dev
```

终端 2（前端，带 HMR 热更新）：

```bash
npm run dev
# 等价于：vite（端口 8080）
```

浏览器打开 `http://localhost:8080`。配置在 `vite.config.js`：

- `/api` 请求会自动代理到 `http://127.0.0.1:8788`（Pages Functions）；
- `@` 别名指向 `src/`。

> 也可不启动 Vite，直接浏览器打开 `http://127.0.0.1:8788` 使用 `dist/` 构建版的完整全栈效果。

## 5. 后端 API 请求协议（与前端 `src/utils.js` 一致）

- 方法：`POST`
- 地址：`/api/{module}`，如 `/api/accountBook`、`/api/payBudget`、`/api/bigType`
- 请求体：`application/x-www-form-urlencoded`（前端用 `qs` 序列化）
- 动作：请求体里的 `info` 字段，如 `info=select_by_month&month=2024-01`
- 响应：`{ tip: 1|0, d: 数据, msg: 消息 }`

用 curl 快速验证后端：

```bash
# 某月收支合并列表
curl -X POST http://127.0.0.1:8788/api/accountBook \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'info=select_by_month&month=2024-08'

# 当月预算列表
curl -X POST http://127.0.0.1:8788/api/payBudget \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'info=select_by_month&month=2024-08'

# 大类列表（收入）
curl -X POST http://127.0.0.1:8788/api/bigType \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'info=select_income'
```

## 6. 常用动作速查（info 取值）

| module | info | 说明 |
| --- | --- | --- |
| accountBook | selectBillByYear | 按年收支/预算汇总 (year) |
| accountBook | selectPayDetailBySidAndTime | 小类周月年明细 (id,d,t) |
| accountBook | selectPayDetailByTime | 全部周月年明细 (d,t) |
| accountBook | select_by_month | 当月收入+支出合并 (month) |
| accountBook | search | 条件搜索 (st,et,n,bn,sn) |
| accountBook | insert / delete / update_type / update_detail | 支出明细写操作 |
| income | insert / delete / update_type / update_detail | 收入写操作 |
| bigType / smallType | select_income / select_pay / select_all_income / select_all_pay | 类型列表 |
| bigType / smallType | insert / update_name / update_px / px / show / hide / delete | 类型写操作 |
| payBudget | select_by_month / copy_by_month / insert / update_detail / update_type / delete | 预算 |

## 7. 常见问题

1. **`wrangler pages dev` 报找不到 `dist/`**：先执行 `npm run build`。
2. **端口冲突**（如 8788 被占用）：`wrangler pages dev --port 8789`，并同步修改
   `vite.config.js` 的 proxy target 端口。
3. **前端 8080 请求 /api 404**：确认 `wrangler pages dev` 正在运行，且 vite 代理端口与
   wrangler 端口一致（默认 8788）。
4. **首次运行/修改数据库后数据不生效**：`wrangler pages dev` 每次重启会读最新本地 D1；
   需重置时删除 `.wrangler/state` 后重新初始化。
5. **浏览器缓存旧页面**：`npm run build` 产物带 hash，可硬刷新；也可用 `npm run pages:dev -- --skip-bundle` 等参数，详见 `wrangler pages dev --help`。