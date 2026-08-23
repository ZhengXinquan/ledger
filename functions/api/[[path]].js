/**
 * functions/api/[[path]].js —— Pages Functions 路由入口（catch-all）
 *
 * 捕获站点 /api/ 下的任意深度路径，把请求与绑定交给 _handler.js 统一分发。
 * Pages Functions 的 catch-all 语法 [[ ]]（如 [[path]].js）会收纳所有子路径，
 * 参数通过 context.params.path 拿到（数组）。
 *
 * 前后端调用约定保持不变：前端照常 POST /api/{module}，请求体为表单格式，
 * 动作由 info 字段指定（见 src/utils.js 的 http 封装与 src/store/index.js）。
 */
import { handleApiRequest } from './_handler.js';

export async function onRequest(context) {
  return handleApiRequest(context.request, context.env, context.params.path);
}