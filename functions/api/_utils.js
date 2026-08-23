/**
 * _utils.js —— Pages Functions 公共工具层
 *
 * 提供所有 API 模块共用的基础能力：
 *   - 统一响应格式 RES（与原 api/class/utils.js 返回约定一致：{ tip, d, msg }）
 *   - Response 输出、application/x-www-form-urlencoded 请求体解析
 *   - 时间口径（北京 +8 时区）与 SQL 时间条件构造
 *   - D1 查询 / 写入封装、_id 生成、日期换算工具
 *
 * 命名约定：文件以下划线开头，表示不会被 Cloudflare Pages 挂载为路由，
 * 只作为内部模块被 functions/api/[[path]].js 及其它 _*.js 引用。
 */

export const RES = {
  success(data, message) {
    return { tip: 1, d: data, msg: message || 'default success' };
  },
  error(data, message) {
    let msg = 'default error';
    if (data && data.message) msg = data.message;
    if (message) msg = message;
    return { tip: 0, d: data, msg };
  },
};

export function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** 解析 application/x-www-form-urlencoded 请求体（前端使用 Qs.stringify 序列化） */
export async function parseUrlencoded(request) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const body = {};
  for (const [k, v] of params.entries()) body[k] = v;
  return body;
}

/** 执行查询 SQL（绑定参数）并返回 results 数组 */
export async function query(db, sql, binds) {
  const res = await db.prepare(sql).bind(...binds).all();
  return res.results || [];
}

/** 执行写 SQL（INSERT/UPDATE/DELETE），返回 D1 run() 结果 */
export function run(db, sql, binds) {
  return db.prepare(sql).bind(...binds).run();
}

/**
 * 按 time/type 构造支出明细的 _aday 时间过滤条件
 * type: week | month | year（对齐原 MongoDB $isoWeekYear / $isoWeek / $year / $month，时区 +0800）
 */
export function timeCond(sqlCol, time, type) {
  if (type === 'week') {
    const y = Number(time.split('-')[0]);
    const w = Number(time.split('-')[1] || 0);
    return {
      sql: `strftime('%G', ${sqlCol}, '+8 hours') = ? AND strftime('%V', ${sqlCol}, '+8 hours') = ?`,
      binds: [String(y), String(w).padStart(2, '0')],
    };
  }
  if (type === 'month') {
    const y = Number(time.split('-')[0]);
    const m = Number(time.split('-')[1] || 1);
    return {
      sql: `strftime('%Y', ${sqlCol}, '+8 hours') = ? AND CAST(strftime('%m', ${sqlCol}, '+8 hours') AS INTEGER) = ?`,
      binds: [String(y), m],
    };
  }
  // year
  return { sql: `strftime('%Y', ${sqlCol}, '+8 hours') = ?`, binds: [String(Number(time))] };
}

/** search 的日期范围条件（边界与原 Mongo new Date('YYYY-MM-DD 00:00:00') 的 UTC 口径对齐） */
export function dayRange(sqlCol, st, et) {
  let sql = '';
  const binds = [];
  if (st) {
    sql += ` AND ${sqlCol} >= ?`;
    binds.push(`${st}T00:00:00.000Z`);
  }
  if (et) {
    sql += ` AND ${sqlCol} <= ?`;
    binds.push(`${et}T23:59:59.000Z`);
  }
  return { sql, binds };
}

/** 合并排序：先 d（日期）降序，再 t（时间）降序 */
export function sortByDT(a, b) {
  return b.d.localeCompare(a.d) || b.t.localeCompare(a.t);
}

/** 生成与 MongoDB ObjectId 同构的 24 位十六进制 _id（D1 以 TEXT 作主键） */
export function newId() {
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

/** 北京(+8)时间字符串 'YYYY-MM-DD HH:mm:ss'（写入 atime/ptime/itime 等展示字段） */
export function localNow(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  const t = new Date(d.getTime() + 8 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`;
}

/** 日期串 → D1 存储 ISO（UTC 零点）。读取端 strftime '+8 hours' 可还原为同一自然日 */
export function isoDay(day) {
  return `${day}T00:00:00.000Z`;
}

/** 上个月 'YYYY-MM'（对齐原 api/payBudget.js copy 的 moment 语义） */
export function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}