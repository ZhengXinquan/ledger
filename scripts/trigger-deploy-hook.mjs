#!/usr/bin/env node
/**
 * 触发 Cloudflare Workers Builds 部署钩子（deploy hook）
 *
 * 等价于命令行：
 *   curl -X POST \
 *     -H "Authorization: Bearer $CF_API_TOKEN" \
 *     https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<HOOK_ID>
 *
 * 该接口需要鉴权（无 token 时 CF 返回 401 Missing token from authorization header）。
 *
 * 用法：
 *   CF_API_TOKEN=<你的 API Token> node scripts/trigger-deploy-hook.mjs
 *   CF_API_TOKEN=<token> node scripts/trigger-deploy-hook.mjs <HOOK_ID>   # 指定钩子 ID
 *   CF_API_BASE=<...> node ...                                           # 测试/代理时可覆盖基础地址
 *
 * 退出码：
 *   0  = 触发请求成功（响应 success=true 或 2xx）
 *   1  = 请求返回非 2xx（含 CF 的错误 JSON）
 *   2  = 未配置 CF_API_TOKEN
 */

const HOOK_ID = process.argv[2] || '4a5c9915-0cb8-41ee-8db6-eefaac1a00b7';
const BASE_URL = process.env.CF_API_BASE || 'https://api.cloudflare.com/client/v4';
const URL = `${BASE_URL}/workers/builds/deploy_hooks/${HOOK_ID}`;

// const token = process.env.CF_API_TOKEN;
// if (!token) {
//   console.error('缺少环境变量 CF_API_TOKEN（Cloudflare API Token）。');
//   console.error('export CF_API_TOKEN=<token>，然后重试本脚本。');
//   process.exit(2);
// }

const response = await fetch(URL, {
  method: 'POST', // 等价于 curl -X POST
  headers: {
    // Authorization: `Bearer ${token}`,
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
  },
});

const raw = await response.text();
console.log(`POST ${URL}`);
console.log(`HTTP ${response.status} ${response.statusText}`);
console.log('--- 响应体 ---');
if (response.ok) {
  // 美化输出；内容不是 JSON 时直接打印原文
  try {
    console.log(JSON.stringify(JSON.parse(raw), null, 2));
  } catch {
    console.log(raw || '（空响应体）');
  }
} else {
  try {
    console.log(JSON.stringify(JSON.parse(raw), null, 2));
  } catch {
    console.log(raw || '（空响应体）');
  }
  console.log('--- 触发失败：请检查 CF_API_TOKEN 权限是否包含对该 Workers 构建的部署权限 ---');
}
process.exit(response.ok ? 0 : 1);