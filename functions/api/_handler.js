/**
 * _handler.js —— Pages Functions 业务路由与分发
 *
 * 入口 onRequest（定义于 functions/api/[[path]].js）接收到的 /api/ 路径形如：
 *   POST /api/accountBook      → path = ['accountBook']
 *   POST /api/accountBook.js   → path = ['accountBook.js']（兼容历史带 .js 的后缀）
 * 本模块负责：解析模块名与 info 动作、定位处理器、统一异常与响应包装。
 *
 * 与历史 Cloudflare Worker 的差异：
 *   - 原 worker.js 拦截 /api/* 全量流量；现在由 Pages Functions 的 /api 路由承担同一职责
 *   - 请求体统一按原前端约定解析为 application/x-www-form-urlencoded
 *   - 响应格式保持 { tip, d, msg }，前端 axios 拦截器无需任何改动
 */

import { RES, json, parseUrlencoded } from './_utils.js';
import { accountBook, accountBookWrites } from './_accountBook.js';
import { incomeWrites } from './_income.js';
import { payBudget, payBudgetWrites } from './_payBudget.js';
import { bigTypeHandlers, smallTypeHandlers } from './_types.js';

/** 路由表：module → { info → handler(body, db) } */
export const ROUTES = {
  accountBook: {
    selectBillByYear: accountBook.selectBillByYear,
    selectPayDetailBySidAndTime: accountBook.selectPayDetailBySidAndTime,
    selectPayDetailByTime: accountBook.selectPayDetailByTime,
    select_by_month: accountBook.selectByMonth,
    search: accountBook.search,
    insert: accountBookWrites.insert,
    delete: accountBookWrites.delete,
    update_type: accountBookWrites.updateType,
    update_detail: accountBookWrites.updateDetail,
  },
  income: {
    insert: incomeWrites.insert,
    delete: incomeWrites.delete,
    update_type: incomeWrites.updateType,
    update_detail: incomeWrites.updateDetail,
  },
  bigType: bigTypeHandlers,
  smallType: smallTypeHandlers,
  payBudget: {
    select_by_month: payBudget.selectByMonth,
    copy_by_month: payBudgetWrites.copyByMonth,
    insert: payBudgetWrites.insert,
    delete: payBudgetWrites.delete,
    update_type: payBudgetWrites.updateType,
    update_detail: payBudgetWrites.updateDetail,
  },
};

/**
 * 统一请求入口：解析 /api/{module}[/{info}]，调用对应处理器。
 * @param {Request} request 原始请求
 * @param {Env} env 含 D1 绑定：env.ledger_db
 * @param {string[]} pathSegments [[path]] 捕获的路径段
 */
export async function handleApiRequest(request, env, pathSegments) {
  // 历史 worker 仅接受 POST；对其它方法直接返回 405，保持兼容
  if (request.method !== 'POST') {
    return json(RES.error([], 'method not allowed'), 405);
  }

  const raw = ((pathSegments || [])[0] || '').trim();
  const moduleName = raw.replace(/\.js$/i, '');
  if (!moduleName) {
    return json(RES.error([], '404: /api/' + (pathSegments || []).join('/')), 404);
  }

  const body = await parseUrlencoded(request).catch(() => ({}));
  const info = body.info || '';

  const mod = ROUTES[moduleName];
  const handler = mod && mod[info];
  if (typeof handler !== 'function') {
    return json(RES.error([], `api/${moduleName}.js : ${info}  err`), 404);
  }

  try {
    return json(await handler(body, env.ledger_db));
  } catch (e) {
    console.error(`[pages-functions] api/${moduleName} ${info} error:`, e);
    return json(RES.error([], e && e.message ? e.message : 'internal error'), 500);
  }
}