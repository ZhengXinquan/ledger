# 部署 / 上线 / 发布（Deployment & Release）

本项目是标准 Cloudflare Pages 项目：**静态前端（`dist/`）+ Pages Functions（`functions/`）+ D1 绑定**。
同一域名同源部署，前端 `/api/*` 直接命中 Pages Functions。支持两种发布方式：**Cloudflare 官方 Git 集成** 或 **Wrangler CLI**。推荐前者（推送即发布、自带预览环境）。

## 前置条件

- 一个 Cloudflare 账号，域名可以暂不绑定（使用默认 `*.pages.dev` 子域）。
- 一个线上 D1 数据库及其 `database_id`。
- 仓库已推送 GitHub / GitLab / Gitee（任一，Git 集成支持）。

## 第一步（一次性）：创建线上 D1 数据库

方式 A——Dashboard：Cloudflare 控制台 → Workers & Pages → D1 → Create database `ledger-db`。

方式 B——CLI（无需登入控制台）：

```bash
npx wrangler login        # 首次需要浏览器授权
npm run db:create         # wrangler d1 create ledger-db
```

两条途径都会获得一个 `database_id`（UUID）。把它填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "ledger_db"
database_name = "ledger-db"
database_id = "<你的 database_id>"
```

> 无论使用哪种发布方式，这里都是 D1 绑定的唯一事实来源。

## 第二步：灌入线上数据（仅首次 / 迁移时）

```bash
# 建表 + 历史数据（由原 MongoDB 导出的 seed）
npx wrangler d1 execute ledger-db --remote --file=migrations/seed.sql

# 或只建表（空库上线）
npx wrangler d1 execute ledger-db --remote --file=migrations/schema.sql
```

> ⚠️ 线上数据请先在本地 `npm run db:local-seed` + `npm run pages:dev` 演练一遍；`--remote` 会直接作用于生产数据库。

## 方式一：Cloudflare 官方 Git 集成（推荐）

1. Dashboard → **Workers & Pages → Create → Pages → Connect to Git**，选择本仓库。
2. 项目设置：
   - **Framework preset / Build command**：`npm run build`
   - **Build output directory**：`dist`
   - 环境变量 / Secrets：通常无需配置（`VITE_API_BASE` 仅在跨域/自定义场景使用，默认 `/`）。
3. 创建后 **项目 → Settings → 绑定（Bindings）→ 添加 D1**：
   - 变量名：`ledger_db`，选择上面创建的 D1 数据库。
4. 每次 `git push` 自动触发构建发布；Git 集成还会为 PR 生成**预览环境**（`xxx.pr-<n>.pages.dev`）。

> Functions 无需任何额外配置——`functions/api/[[path]].js` 会自动作为 `/api/*` 上线，且会自动读取 Git 集成项目绑定。

## 方式二：Wrangler CLI（无 Git 集成时）

```bash
npm run build             # 构建前端到 dist/
npm run pages:deploy      # wrangler pages deploy
```

- `wrangler pages deploy` 读取 `wrangler.toml`（`pages_build_output_dir` + D1 绑定）；
- 首次执行会询问是否注册项目、选择默认子域；之后 `git push` 不再触发发布，需手动执行本命令。

## 发布 / 回滚流程

1. **开发**：`npm run dev` + `npm run pages:dev` 本地调试（见 `LOCAL_DEVELOPMENT.md`）。
2. **提交**：`git push` 后 Git 集成构建部署；CLI 方式则手动 `npm run pages:deploy`。
3. **预览验证**：Git 集成的每个 PR 自动生成预览 URL；CLI 方式可用
   `wrangler pages deploy --branch=<分支名>` 生成对应分支预览。
4. **线上回滚**：Dashboard → Pages 项目 → **Deployments** 保留每次发布版本，
   找到目标版本点 **Rollback to this deployment** 即可秒回滚（静态 + Functions 整体回滚）。
5. **数据库变更**：涉及结构调整时先改 `migrations/schema.sql`，用
   `wrangler d1 execute ledger-db --remote --file=migrations/schema.sql` 在停机窗口执行；
   纯数据操作可随时执行，注意与前端兼容。

## 域名 / HTTPS

- 默认获得 `<项目名>.pages.dev` HTTPS 子域，开箱即用。
- 绑定自定义域名：**Project → Custom domains → Set up a custom domain**，
  在 DNS 处添加 CNAME 指向 `<项目名>.pages.dev`；Cloudflare 自动签发 HTTPS 证书。

## 线上运维命令速查

| 用途 | 命令 |
| --- | --- |
| 增删改业务数据（临时） | `wrangler d1 execute ledger-db --remote --command="UPDATE ..."` |
| 查看表数据 | `wrangler d1 execute ledger-db --remote --command="SELECT ..."` |
| 线上 SQL 文件执行 | `wrangler d1 execute ledger-db --remote --file=xxx.sql` |
| 本地 SQL 文件执行 | `npm run db:local-init` / `npm run db:local-seed` |
| 数据备份/导出 | `wrangler d1 export ledger-db --remote --no-schema --output=backup.sql`（wrangler ≥4 新版含 `d1 export`/`d1 backup`） |

> D1 线上数据备份也可在 Dashboard → D1 → 数据库 → Backup / Restore 完成。

## 环境切换注意点

- `DEFAULT_API`（`src/utils.js`）= `import.meta.env.VITE_API_BASE || '/'`。
  本项目默认同源，**无需任何后端地址配置**。
- 仅当你把静态站与 API 拆成两个独立项目部署时才需要设置
  `VITE_API_BASE=https://your-project.pages.dev/`（构建时注入）。