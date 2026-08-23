# 文件结构说明（File Organization）

本项目的架构为标准的 **Cloudflare Pages（静态前端）+ Pages Functions（即 Worker 层，提供 `/api/*`）+ D1（SQLite）** 三件套：

```
┌─────────────────────────── Cloudflare Pages ──────────────────────────────┐
│  静态资源（dist/）            Pages Functions（functions/）                  │
│  Vue3 + Vite 构建产物      routes:
│  ✓ /  → index.html   ✓ /api/* → functions/api/[[path]].js                 │
│                         绑定：env.ledger_db → Cloudflare D1                │
└────────────────────────────────────────────────────────────────────────────┘
```

同源部署：前端 `POST /api/xxx` 直接打到同一域名的 Pages Functions，无需跨域配置。

## 目录总览

```
ledger/
├── index.html                 # Vite 应用 HTML 入口（挂载 #app）
├── vite.config.js             # Vite 构建 / 联调代理配置（@ 别名 → src，/api → 8788）
├── wrangler.toml              # Pages + D1 运行配置（pages_build_output_dir、d1_databases）
├── package.json               # 依赖与脚本（dev/build/pages:dev/pages:deploy/db:*）
├── .gitignore                 # node_modules、dist、.wrangler 等
├── jsconfig.json              # 编辑器 JS 路径提示（与 vite 别名一致）
├── .prettierrc.js             # 代码格式化
├── .editorconfig              # 编辑器基础风格
├── .vscode/extensions.json    # 推荐插件
│
├── src/                       # ★ 前端（Vue3 组合式 + Vant4 + ECharts）
│   ├── main.js                # 入口：创建应用、注册组件/指令
│   ├── App.vue                # 根组件：底部导航切换四大视图
│   ├── utils.js               # 后端调用封装 request()、DEFAULT_API（默认 '/'）
│   ├── utils/
│   │   └── date.js            # 日期工具（format、周/月/年换算）
│   ├── styles/
│   │   └── index.css          # 全局样式
│   ├── store/
│   │   └── index.js           # 全局共享状态（服务层）：类型/明细/预算/图表等 reactive 单例
│   ├── views/                 # 四个主页面（路由 tab）
│   │   ├── DetailView.vue     # 明细页
│   │   ├── ChartView.vue      # 图表页（月度明细列表 + ECharts 预览）
│   │   ├── BillView.vue       # 账单页（年度收支/预算与详情组件）
│   │   └── BudgetView.vue     # 预算页（月度预算 + 预算环）
│   └── components/            # 业务组件（弹层、键盘、列表等），按用途划分
│       ├── SearchSheet.vue / PayDetailList.vue / ProgressRing.vue
│       ├── TypeManageSheet.vue / TypeManageList.vue / TypeSelectSheet.vue
│       ├── KeyboardSheet.vue / NewSmallTypeSheet.vue / DatePickerSheet.vue
│       ├── PromptDialog.vue / TabBar.vue / LoadingMask.vue /
│       └── BudgetDetailSheet.vue / BudgetSmallDetailSheet.vue
│
├── functions/                 # ★ 后端（Cloudflare Pages Functions = Worker 层）
│   └── api/
│       ├── [[path]].js        # 路由入口：catch-all，捕获 /api/*，转发给 _handler.js
│       ├── _handler.js        # 路由表 + 分发：/api/{module} → info → handler(body, db)
│       ├── _accountBook.js    # 支出明细（aa_account_book）：查询/增删改
│       ├── _income.js         # 收入记录（aa_income）写操作
│       ├── _payBudget.js      # 预算（aa_pay_budget）：月度查询 / 复制 / 增删改
│       ├── _types.js          # 大类（aa_big_type）/小类（aa_small_type）查询与写操作
│       └── _utils.js          # 公共工具：RES/json/解析/时间口径/D1 封装
│
├── migrations/                # ★ SQL 数据库脚本
│   ├── schema.sql             # 建表结构（5 张业务表）
│   └── seed.sql               # 建表 + 全量数据（原 MongoDB 数据集，可直接本地/线上灌入）
│
├── docs/
│   ├── FILE_STRUCTURE.md      # 本文件
│   ├── LOCAL_DEVELOPMENT.md   # 本地运行步骤
│   └── DEPLOYMENT.md          # 上线 / 发布 / 数据库运维
│
└── README.md                  # 项目说明 + 文档索引
```

## 各部分职责与约定

### 前端 `src/`
- 纯静态 SPA，构建产物到 `dist/`（由 `vite.config.js` 默认输出）。
- 所有后端调用统一走 `src/utils.js` 的 `request(url, postData, toLoading)`：
  - 方法 `POST`，内容类型 `application/x-www-form-urlencoded`；
  - `url` 形如 `api/accountBook` 或 `api/payBudget`；
  - `postData` 里的 `info` 字段指定具体动作，如 `{ info: 'select_by_month', month: '2024-01' }`。
- 后端地址默认 `DEFAULT_API = '/'`（同源）；如需跨域可设 `VITE_API_BASE`。

### 后端 `functions/`
- `functions/api/[[path]].js` 是 Pages Functions 的 catch-all 路由入口，凡 `/api/*` 均落入。
- **以下划线 `_` 开头的文件不会被 Pages 挂载为路由**（本目录所有 `_*.js` 均为内部模块），
  只有 `[[path]].js` 成为真正的端点。
- `_handler.js` 维护 `ROUTES` 路由表，保持与原 Worker `worker.js` 相同的
  `module + info → handler(body, db)` 调用语义，响应格式不变（`{ tip, d, msg }`）。

### 数据库 `migrations/`
- `schema.sql`：只建表；`seed.sql`：建表 + 历史数据。二者表结构一致。
- 字段约定：`_xx` 前缀为面向 SQL 的规范化字段（ISO 时间），无前缀字段保留旧展示口径。

### 其他
- `wrangler.toml` 是本项目的“云配置唯一来源”：`pages_build_output_dir = "dist"`
  + `d1_databases` 绑定 `ledger_db`。本地与线上均以其为准。
- `node_modules/`、`dist/`、`.wrangler/` 为生成物，已加入 `.gitignore`。

## 本次重构删除的遗留内容

| 删除项 | 原因 |
| --- | --- |
| `worker.js` | 单体 Worker 逻辑已按模块拆分进 `functions/api/` |
| `api/`（含 `accountBook.js`、`class/`） | MongoDB 时代的 Node/PHP 后端，已被 D1 + Pages Functions 取代 |
| `old/`、`awk`、`cd`、`ls`（空文件）、`test.js`、`init.js` | 历史实验 / 空文件 |
| `exportD1.js`、`MONGODB_TO_D1.md` | Mongo→D1 迁移工具过程产物；数据已在 `migrations/seed.sql` 固定 |
| `babel.config.js`、`.eslintrc.js`、`.eslintignore` | 未配置/未使用（本项目用 Vite + Prettier） |
| `.github/` | 部署方式统一为 Cloudflare Pages 原生 Git 集成，无需 GitHub Actions |
| `src/components/{mixin.js,utils.js,HelloWorld.vue,Component*List.vue}` | 被 `src/store/index.js` 取代的旧式组件，已无引用 |
| `dist/`、`.wrangler/` | 本地生成物，重新构建/本地运行即可 |