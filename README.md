# 账本（ledger）

家庭记账 Web 应用：**Vue3 前端 + Cloudflare Pages Functions（Worker）+ D1 数据库**。
提供收支明细、分类（大/小类）、月度预算、年度账单汇总与 ECharts 图表。

> 本项目由早期 MongoDB/Vercel 时代的旧代码迁移而来，现已重构为标准的
> Cloudflare Pages（静态托管）+ Pages Functions（`/api/*`）+ D1（SQLite）架构，
> Mongoose 与 PHP 等遗留代码已移除。

## 快速开始（本地运行）

```bash
npm install                 # 安装依赖（含 wrangler）
npm run db:local-init       # 初始化本地 D1 表结构
npm run db:local-seed       # （可选）灌入历史数据，便于查看真实效果
npm run pages:dev           # 启动后端 + Pages 静态服务 → http://127.0.0.1:8788
npm run dev                 # （可选）Vite 开发服务器 + /api 代理 → http://localhost:8080
```

详细步骤见 [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)。

## 部署 / 发布

- 官方 Git 集成：Cloudflare Dashboard 创建 Pages 项目，绑定仓库，
  构建命令 `npm run build`，输出目录 `dist`；`functions/` 自动作为 Functions 上线。
- 或 Wrangler CLI：`npm run build && npm run pages:deploy`。

完整发布与线上数据库运维见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [docs/FILE_STRUCTURE.md](docs/FILE_STRUCTURE.md) | 项目文件组织、前后端约定、路由规则 |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | 本地初始化、本地运行、常见问题 |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 上线 / 发布 / D1 线上运维 / 回滚 |

## 主要脚本

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | Vite 开发服务器（8080，/api 代理到 8788） |
| `npm run build` | 构建静态前端到 `dist/` |
| `npm run pages:dev` | wrangler 本地运行 Pages（静态 + Functions，8788） |
| `npm run pages:deploy` | wrangler 发布 Pages（静态 + Functions） |
| `npm run db:local-init` | 本地 D1 执行 `migrations/schema.sql` |
| `npm run db:local-seed` | 本地 D1 执行 `migrations/seed.sql`（建表+数据） |
| `npm run db:create` | 线上创建 D1 数据库（获取 database_id） |

## 技术栈

- 前端：Vue 3（Options API）、Vant 4、ECharts 5、Vuedraggable、Axios、Vite 5
- 后端：Cloudflare Pages Functions（模块化 ES import）、Cloudflare D1（SQLite）
- 工具：Wrangler 4、Prettier
