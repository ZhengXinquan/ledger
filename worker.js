/**
 * worker.js —— Cloudflare Workers + D1：账本查询 + 增删改接口
 *
 * 迁移自 api/*（Vercel Serverless）→ api/class/* 的 MongoDB 查询聚合与写操作逻辑。
 * 与原有调用方式保持兼容：POST 到 /api/<module>，Content-Type 为
 * application/x-www-form-urlencoded（前端 src/components/utils.js 用 Qs.stringify 序列化），
 * 请求体含 info 字段表示操作；返回格式沿用 { tip, d, msg }（见 api/class/utils.js RES）。
 *
 * 说明：
 *   1. 读写均已迁移：查询 / 明细 / 预算统计 + 增删改与排序（insert/delete/update_name/update_type/update_detail/show/hide/px/copy_by_month 等）。
 *      接口形态与 api/class/*.js（MongoDB）保持一致，返回 { tip, d, msg }。
 *      注：原 Mongo delete 的实现把 deleteOne 注释掉了（只 findOne 后返回成功），
 *      这里按业务语义实现真正的删除，否则前端刷新后记录仍存在。
 *   2. 时间口径与 Mongo 聚合对齐：
 *      - 月/年：strftime('%Y-%m' / '%Y') + '+8 hours'（北京时区）
 *      - 周：strftime('%G'（ISO 年）/ '%V'（ISO 周），对应 Mongo $isoWeekYear/$isoWeek
 */

/**
 * 返回格式与 api/class/utils.js 的 RES 保持一致
 */
const RES = {
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

function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** 解析 application/x-www-form-urlencoded 请求体（前端使用 Qs.stringify） */
async function parseUrlencoded(request) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const body = {};
  for (const [k, v] of params.entries()) body[k] = v;
  return body;
}

/**
 * 按 time/type 构造支出明细的 _aday 时间过滤条件
 * type: week | month | year（对齐 Mongo $isoWeekYear/$isoWeek/$year/$month，时区 +0800）
 */
function timeCond(sqlCol, time, type) {
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

/**
 * search 的日期范围条件
 * 边界与原 Mongo 的 new Date('YYYY-MM-DD 00:00:00')（Vercel 服务器时区 UTC）对齐
 */
function dayRange(sqlCol, st, et) {
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

/** 合并排序：先 d（日期）降序，再 t（时间）降序（对齐 Mongo res.sort 两次） */
function sortByDT(a, b) {
  return b.d.localeCompare(a.d) || b.t.localeCompare(a.t);
}

/** 支出明细公共 SQL 头（join 小类、大类） */
const PAY_DETAIL_STAR =
  `SELECT ab._id AS id, st._id AS tid, st.sname AS tn, b._id AS bid, b.bname AS bn, ` +
  `ab.aname AS n, ab.amoney AS m, ` +
  `strftime('%Y-%m-%d', ab._aday, '+8 hours') AS d, ` +
  `strftime('%Y-%m-%d %H:%M:%S', ab._atime, '+8 hours') AS t ` +
  `FROM aa_account_book ab ` +
  `JOIN aa_small_type st ON st._id = ab._sid ` +
  `JOIN aa_big_type b ON b._id = st._bid `;

/** 执行 SQL（绑定参数）并返回 results 数组 */
async function query(db, sql, binds) {
  const res = await db.prepare(sql).bind(...binds).all();
  return res.results || [];
}

/** 执行写 SQL（INSERT/UPDATE/DELETE），返回 D1 run() 结果 */
function run(db, sql, binds) {
  return db.prepare(sql).bind(...binds).run();
}

/** 生成与 Mongo ObjectId 同构的 24 位十六进制 _id（D1 以 TEXT 作主键） */
function newId() {
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

/** 北京(+8)时间字符串 'YYYY-MM-DD HH:mm:ss'（写入 atime/ptime/itime 等展示字段） */
function localNow(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  const t = new Date(d.getTime() + 8 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`;
}

/** 日期串 → D1 存储 ISO（UTC 零点）。读取端 strftime '+8 hours' 可还原为同一自然日 */
function isoDay(day) {
  return `${day}T00:00:00.000Z`;
}

/** 上个月 'YYYY-MM'（对齐 api/payBudget.js copy 的 moment 语义） */
function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST') {
      return json(RES.error([], 'method not allowed'), 405);
    }
    const m = url.pathname.match(/^\/api\/([^/]+?)(?:\.js)?\/?$/);
    if (!m) return json(RES.error([], `404: ${url.pathname}`), 404);

    const moduleName = m[1];
    const body = await parseUrlencoded(request).catch(() => ({}));
    const info = body.info || '';

    const handler = ROUTES[moduleName] && ROUTES[moduleName][info];
    if (!handler) {
      return json(RES.error([], `api/${moduleName}.js : ${info}  err`));
    }
    try {
      return json(await handler(body, env.ledger_db));
    } catch (e) {
      console.error(`[worker] api/${moduleName} ${info} error:`, e);
      return json(RES.error([], e && e.message ? e.message : 'internal error'));
    }
  },
};

/* ============================ api/accountBook ============================ */

const accountBook = {
  /**
   * 按年统计每月支出 / 收入 / 预算，并给出全年合计
   * POST { year }
   */
  async selectBillByYear(body, db) {
    const y = String(Number(body.year));
    const [pay, income, budget] = await Promise.all([
      query(
        db,
        `SELECT strftime('%Y-%m', _aday, '+8 hours') AS d, SUM(amoney) AS pay
         FROM aa_account_book
         WHERE strftime('%Y', _aday, '+8 hours') = ?
         GROUP BY d`,
        [y],
      ),
      query(
        db,
        `SELECT strftime('%Y-%m', _iday, '+8 hours') AS d, SUM(imoney) AS income
         FROM aa_income
         WHERE strftime('%Y', _iday, '+8 hours') = ?
         GROUP BY d`,
        [y],
      ),
      query(
        db,
        `SELECT strftime('%Y-%m', _pmonth, '+8 hours') AS d, SUM(pmoney) AS budget
         FROM aa_pay_budget
         WHERE strftime('%Y', _pmonth, '+8 hours') = ?
         GROUP BY d`,
        [y],
      ),
    ]);

    const payMap = new Map(pay.map(r => [r.d, Number(r.pay) || 0]));
    const incMap = new Map(income.map(r => [r.d, Number(r.income) || 0]));
    const budMap = new Map(budget.map(r => [r.d, Number(r.budget) || 0]));

    // 取年度内全部有记录月份（比原“支出分组为主”更完整），按月份降序
    const months = new Set([...pay, ...income, ...budget].map(r => r.d));
    const list = [...months].sort((a, b) => b.localeCompare(a)).map(d => {
      const p = payMap.get(d) || 0;
      const inc = incMap.get(d) || 0;
      const bud = budMap.get(d) || 0;
      return {
        d,
        pay: p,
        income: inc,
        budget: bud,
        lincome: inc - p,
        lbudget: bud - p,
      };
    });

    let paySum = 0, incomeSum = 0, budgetSum = 0, lincomeSum = 0, lbudgetSum = 0;
    for (const e of list) {
      paySum += e.pay;
      incomeSum += e.income;
      budgetSum += e.budget;
      lincomeSum += e.lincome;
      lbudgetSum += e.lbudget;
    }
    return RES.success({
      d: list,
      pay: paySum,
      income: incomeSum,
      budget: budgetSum,
      lincome: lincomeSum,
      lbudget: lbudgetSum,
    });
  },

  /**
   * 某小类在 周/月/年 的支出明细
   * POST { id: 小类 _id, d: time, t: 'week'|'month'|'year' }
   */
  async selectPayDetailBySidAndTime(body, db) {
    const cond = timeCond('ab._aday', body.d, body.t);
    const list = await query(
      db,
      `SELECT ab._id AS id, st._id AS tid, st.sname AS tn,
              ab.aname AS n, ab.amoney AS m,
              strftime('%Y-%m-%d', ab._aday, '+8 hours') AS d,
              strftime('%Y-%m-%d %H:%M:%S', ab._atime, '+8 hours') AS t
       FROM aa_account_book ab
       JOIN aa_small_type st ON st._id = ab._sid
       WHERE ab._sid = ? AND ${cond.sql}
       ORDER BY ab.amoney DESC, ab._id ASC`,
      [body.id, ...cond.binds],
    );
    const sum = list.reduce((pre, cur) => pre + Number(cur.m), 0);
    return RES.success({ d: list, sum });
  },

  /**
   * 全部 周/月/年 的支出明细（含小类与大类信息）
   * POST { d: time, t: 'week'|'month'|'year' }
   */
  async selectPayDetailByTime(body, db) {
    const cond = timeCond('ab._aday', body.d, body.t);
    const list = await query(
      db,
      `${PAY_DETAIL_STAR}
       WHERE ${cond.sql}
       ORDER BY d DESC, t DESC, ab._id ASC`,
      cond.binds,
    );
    const sum = list.reduce((pre, cur) => pre + Number(cur.m), 0);
    return RES.success({ d: list, sum });
  },

/**
   * 当月收入 + 支出明细合并列表
   * POST { month: 'YYYY-MM' }
   */
  async selectByMonth(body, db) {
    const y = String(Number(body.month.split('-')[0]));
    const m = Number(body.month.split('-')[1]);
    const [incomeList, payList] = await Promise.all([
      query(
        db,
        `SELECT inc._id AS id, inc._bid AS bid, inc._bid AS tid,
                b.btype AS tt, b.bname AS tn, b.bname AS bn,
                inc.iname AS n, inc.imoney AS m,
                strftime('%Y-%m-%d', inc._iday, '+8 hours') AS d,
                strftime('%Y-%m-%d %H:%M:%S', inc._itime, '+8 hours') AS t,
                'income' AS rowType
         FROM aa_income inc
         JOIN aa_big_type b ON b._id = inc._bid
         WHERE strftime('%Y', inc._iday, '+8 hours') = ?
           AND CAST(strftime('%m', inc._iday, '+8 hours') AS INTEGER) = ?`,
        [y, m],
      ),
      query(
        db,
        `SELECT ab._id AS id, st._id AS tid, st.sname AS tn, b._id AS bid,
                b.bname AS bn, b.btype AS tt,
                ab.aname AS n, ab.amoney AS m,
                strftime('%Y-%m-%d', ab._aday, '+8 hours') AS d,
                strftime('%Y-%m-%d %H:%M:%S', ab._atime, '+8 hours') AS t,
                'a-book' AS rowType
         FROM aa_account_book ab
         JOIN aa_small_type st ON st._id = ab._sid
         JOIN aa_big_type b ON b._id = st._bid
         WHERE strftime('%Y', ab._aday, '+8 hours') = ?
           AND CAST(strftime('%m', ab._aday, '+8 hours') AS INTEGER) = ?`,
        [y, m],
      ),
    ]);
    return RES.success(incomeList.concat(payList).sort(sortByDT));
  },
/**
   * 按条件搜索收入 + 支出明细（名称/大类名/小类名/日期范围模糊匹配）
   * POST { st, et, n, bn, sn }
   */
  async search(body, db) {
    const n = body.n || '';
    const bn = body.bn || '';
    const sn = body.sn || '';
    const day = dayRange('inc._iday', body.st, body.et);
    const incomeList = await query(
      db,
      `SELECT inc._id AS id, inc._bid AS bid, inc._bid AS tid,
              b.btype AS tt, b.bname AS tn, b.bname AS bn,
              inc.iname AS n, inc.imoney AS m,
              strftime('%Y-%m-%d', inc._iday, '+8 hours') AS d,
              strftime('%Y-%m-%d %H:%M:%S', inc._itime, '+8 hours') AS t,
              'income' AS rowType
       FROM aa_income inc
       JOIN aa_big_type b ON b._id = inc._bid
       WHERE (? = '' OR inc.iname LIKE ? COLLATE BINARY)
         AND (? = '' OR b.bname LIKE ? COLLATE BINARY)
         ${day.sql}`,
      [n, `%${n}%`, bn, `%${bn}%`, ...day.binds],
    );

    const payDay = dayRange('ab._aday', body.st, body.et);
    const payList = await query(
      db,
      `SELECT ab._id AS id, st._id AS tid, st.sname AS tn, b._id AS bid,
              b.bname AS bn, b.btype AS tt,
              ab.aname AS n, ab.amoney AS m,
              strftime('%Y-%m-%d', ab._aday, '+8 hours') AS d,
              strftime('%Y-%m-%d %H:%M:%S', ab._atime, '+8 hours') AS t,
              'a-book' AS rowType
       FROM aa_account_book ab
       JOIN aa_small_type st ON st._id = ab._sid
       JOIN aa_big_type b ON b._id = st._bid
       WHERE (? = '' OR ab.aname LIKE ? COLLATE BINARY)
         AND (? = '' OR b.bname LIKE ? COLLATE BINARY)
         AND (? = '' OR st.sname LIKE ? COLLATE BINARY)
         ${payDay.sql}`,
      [n, `%${n}%`, bn, `%${bn}%`, sn, `%${sn}%`, ...payDay.binds],
    );

    return RES.success(incomeList.concat(payList).sort(sortByDT));
  },
};

/* ============================ api/bigType / api/smallType ============================ */

/**
 * 大类查询 SQL：select_income(1)/select_pay(2) 仅显示；select_all_* 不过滤 bshow
 */
function bigTypeSelect(btype, showOnly) {
  return `SELECT _id AS id, bname AS n, bname AS bn, bshow AS s, bpx AS i
          FROM aa_big_type
          WHERE btype = ?${showOnly ? ' AND bshow = ?' : ''}
          ORDER BY bpx DESC, _id ASC`;
}

/**
 * 小类查询 SQL（join 大类，带大类名/类型）
 */
function smallTypeSelect(btype, showOnly) {
  return `SELECT s._id AS id, s._bid AS bid, s.sname AS n, s.sshow AS s, s.spx AS i,
                 b.btype AS t, b.bname AS bn
          FROM aa_small_type s
          JOIN aa_big_type b ON b._id = s._bid
          WHERE b.btype = ?${showOnly ? ' AND s.sshow = ?' : ''}
          ORDER BY s.spx DESC, s._id ASC`;
}

/**
 * bigType / smallType 公用 handler（4 个 select 变体）
 */
function typeModuleHandler(sqlBuilder) {
  return {
    select_income: (b, db) => query(db, sqlBuilder(1, true), [1, 1]).then(RES.success),
    select_pay: (b, db) => query(db, sqlBuilder(2, true), [2, 1]).then(RES.success),
    select_all_income: (b, db) => query(db, sqlBuilder(1, false), [1]).then(RES.success),
    select_all_pay: (b, db) => query(db, sqlBuilder(2, false), [2]).then(RES.success),
  };
}
/* ============================ api/payBudget ============================ */

const payBudget = {
  /**
   * 某月预算列表（join 小类/大类，附当月实际支出 pm 与结余 lm）
   * POST { month: 'YYYY-MM' }
   */
  async selectByMonth(body, db) {
    const y = String(Number(body.month.split('-')[0]));
    const m = Number(body.month.split('-')[1]);
    const list = await query(
      db,
      `SELECT pb._id AS id, pb._sid AS sid, st._bid AS bid,
              pb.pmoney AS m,
              strftime('%Y-%m-%d', pb._pmonth, '+8 hours') AS d,
              st.sname AS sn, b.bname AS bn,
              COALESCE(ac.summoney, 0) AS pm
       FROM aa_pay_budget pb
       JOIN aa_small_type st ON st._id = pb._sid
       JOIN aa_big_type b ON b._id = st._bid
       LEFT JOIN (
         SELECT ab._sid AS _sid, SUM(ab.amoney) AS summoney
         FROM aa_account_book ab
         WHERE strftime('%Y', ab._aday, '+8 hours') = ?
           AND CAST(strftime('%m', ab._aday, '+8 hours') AS INTEGER) = ?
         GROUP BY ab._sid
       ) ac ON ac._sid = pb._sid
       WHERE substr(pb.pmonth, 1, 7) = ?
       ORDER BY pb.pmoney DESC, pb._ptime DESC, pb._id ASC`,
      [y, m, body.month],
    );
    list.forEach(e => {
      e.m = Number(e.m) || 0;
      e.pm = Number(e.pm) || 0;
      e.lm = e.m - e.pm;
    });
    return RES.success(list);
  },
};

/* ======================== 写操作（增 / 删 / 改） ======================== */

/* accountBook 支出明细的增删改（与 api/accountBook.js | api/class/accountBook.js 字段一一对应） */
const accountBookWrites = {
  /** POST { tid: 小类 _id, n: 名称, m: 金额(分), d: 'YYYY-MM-DD' } */
  async insert(body, db) {
    const now = new Date();
    const d = body.d;
    await run(
      db,
      `INSERT INTO aa_account_book (_id, sid, aname, amoney, aday, atime, cid, _sid, _aday, _atime)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        newId(), body.tid, body.n, Number(body.m),
        d.replace(/-/g, '/'), localNow(now),
        body.tid, isoDay(d), now.toISOString(),
      ],
    );
    return RES.success('Succeed insert account_book');
  },
  /** POST { id } */
  async delete(body, db) {
    await run(db, 'DELETE FROM aa_account_book WHERE _id = ?', [body.id]);
    return RES.success('Succeed DELETE account_book');
  },
  /** POST { id, tid: 小类 _id } 修改记录所属小类 */
  async updateType(body, db) {
    await run(db, 'UPDATE aa_account_book SET sid = ?, _sid = ? WHERE _id = ?', [body.tid, body.tid, body.id]);
    return RES.success('Succeed updateType account_book');
  },
  /** POST { id, n, m, d } */
  async updateDetail(body, db) {
    const d = body.d;
    await run(
      db,
      'UPDATE aa_account_book SET aname = ?, amoney = ?, aday = ?, _aday = ? WHERE _id = ?',
      [body.n, Number(body.m), d.replace(/-/g, '/'), isoDay(d), body.id],
    );
    return RES.success('Succeed updateDetail account_book');
  },
};

/* income 收入记录的增删改（与 api/income.js | api/class/income.js 字段一一对应） */
const incomeWrites = {
  /** POST { tid: 大类 _id, n: 名称, m: 金额(分), d: 'YYYY-MM-DD' } */
  async insert(body, db) {
    const now = new Date();
    const d = body.d;
    await run(
      db,
      `INSERT INTO aa_income (_id, bid, iname, iday, itime, cid, imoney, _bid, _iday, _itime)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        newId(), body.tid, body.n, d.replace(/-/g, '/'), localNow(now),
        Number(body.m), body.tid, isoDay(d), now.toISOString(),
      ],
    );
    return RES.success('Succeed insert income');
  },
  /** POST { id } */
  async delete(body, db) {
    await run(db, 'DELETE FROM aa_income WHERE _id = ?', [body.id]);
    return RES.success('Succeed DELETE income');
  },
  /** POST { id, tid: 大类 _id } */
  async updateType(body, db) {
    await run(db, 'UPDATE aa_income SET bid = ?, _bid = ? WHERE _id = ?', [body.tid, body.tid, body.id]);
    return RES.success('Succeed updateType income');
  },
  /** POST { id, n, m, d } */
  async updateDetail(body, db) {
    const d = body.d;
    await run(
      db,
      'UPDATE aa_income SET iname = ?, imoney = ?, iday = ?, _iday = ? WHERE _id = ?',
      [body.n, Number(body.m), d.replace(/-/g, '/'), isoDay(d), body.id],
    );
    return RES.success('Succeed updateDetail income');
  },
};
/* payBudget 预算的增删改 + 复制（与 api/payBudget.js | api/class/payBudget.js 字段一一对应） */
const payBudgetWrites = {
  /** POST { month: 'YYYY-MM' } 把上个月预算整体复制到目标月份 */
  async copyByMonth(body, db) {
    const fullTime = body.month + '-01';
    const last = prevMonth(body.month);
    const list = await query(
      db,
      `SELECT sid, pmoney, _sid, cid FROM aa_pay_budget WHERE substr(pmonth, 1, 7) = ?`,
      [last],
    );
    const now = new Date();
    for (const e of list) {
      await run(
        db,
        `INSERT INTO aa_pay_budget (_id, sid, pmoney, pmonth, ptime, cid, _sid, _pmonth, _ptime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(), e.sid, e.pmoney, fullTime, localNow(now),
          e.cid == null ? 0 : e.cid, e._sid, isoDay(fullTime), now.toISOString(),
        ],
      );
    }
    return RES.success('Succeed copy_by_month pay_budget');
  },
  /** POST { tid: 小类 _id, m: 金额(分), d: 'YYYY-MM' } */
  async insert(body, db) {
    const now = new Date();
    const fullTime = body.d + '-01';
    await run(
      db,
      `INSERT INTO aa_pay_budget (_id, sid, pmoney, pmonth, ptime, cid, _sid, _pmonth, _ptime)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        newId(), body.tid, Number(body.m), fullTime, localNow(now),
        body.tid, isoDay(fullTime), now.toISOString(),
      ],
    );
    return RES.success('Succeed insert budget');
  },
  /** POST { ids: 逗号分隔的预算行 _id } */
  async delete(body, db) {
    const ids = (body.ids || '').split(',').filter(Boolean);
    if (ids.length) {
      await run(db, `DELETE FROM aa_pay_budget WHERE _id IN (${ids.map(() => '?').join(',')})`, ids);
    }
    return RES.success('Succeed DELETE pay_budget');
  },
  /** POST { id, tid: 小类 _id } */
  async updateType(body, db) {
    await run(db, 'UPDATE aa_pay_budget SET sid = ?, _sid = ? WHERE _id = ?', [body.tid, body.tid, body.id]);
    return RES.success('Succeed updateType budget');
  },
  /** POST { id, m, d: 'YYYY-MM-DD' } */
  async updateDetail(body, db) {
    const d = body.d;
    await run(
      db,
      'UPDATE aa_pay_budget SET pmoney = ?, pmonth = ?, _pmonth = ? WHERE _id = ?',
      [Number(body.m), d, isoDay(d), body.id],
    );
    return RES.success('Succeed updateDetail budget');
  },
};

/* bigType / smallType 写操作（与 api/bigType.js · api/smallType.js 语义一致）
 * cfg: { table, isBig, name, px, show }
 * - isBig=true 时 insert 的 m 为 btype(1收入/2支出)；isBig=false 时 insert 的 m 为归属大类 _bid
 */
const BIG_TYPE_CFG = { table: 'aa_big_type', isBig: true, name: 'bname', px: 'bpx', show: 'bshow' };
const SMALL_TYPE_CFG = { table: 'aa_small_type', isBig: false, name: 'sname', px: 'spx', show: 'sshow' };

function typeWriteHandler(cfg) {
  return {
    /** POST { n, m } */
    async insert(body, db) {
      const id = newId();
      if (cfg.isBig) {
        await run(db, 'INSERT INTO aa_big_type (_id, bname, btype, bshow, bpx) VALUES (?, ?, ?, 1, 0)', [
          id,
          body.n,
          Number(body.m),
        ]);
      } else {
        await run(db, 'INSERT INTO aa_small_type (_id, sname, sshow, spx, _bid) VALUES (?, ?, 1, 0, ?)', [
          id,
          body.n,
          body.m,
        ]);
      }
      return RES.success('Succeed insert ' + cfg.table);
    },
    /** POST { id, n } */
    update_name: (body, db) =>
      run(db, `UPDATE ${cfg.table} SET ${cfg.name} = ? WHERE _id = ?`, [body.n, body.id]).then(
        () => RES.success('Succeed update_name ' + cfg.table),
      ),
    /** POST { id, p } */
    update_px: (body, db) =>
      run(db, `UPDATE ${cfg.table} SET ${cfg.px} = ? WHERE _id = ?`, [Number(body.p), body.id]).then(
        () => RES.success('Succeed update_px ' + cfg.table),
      ),
    /** POST { list: JSON.stringify({ _id: 新px, ... }) } 拖拽排序批量更新 */
    async px(body, db) {
      const map = JSON.parse(body.list || '{}');
      for (const id of Object.keys(map)) {
        await run(db, `UPDATE ${cfg.table} SET ${cfg.px} = ? WHERE _id = ?`, [Number(map[id]), id]);
      }
      return RES.success('Succeed px ' + cfg.table);
    },
    /** POST { id } 显示 */
    async show(body, db) {
      await run(db, `UPDATE ${cfg.table} SET ${cfg.show} = 1 WHERE _id = ?`, [body.id]);
      return RES.success('Succeed show ' + cfg.table);
    },
    /** POST { id } 隐藏 */
    async hide(body, db) {
      await run(db, `UPDATE ${cfg.table} SET ${cfg.show} = 0 WHERE _id = ?`, [body.id]);
      return RES.success('Succeed hide ' + cfg.table);
    },
    /** POST { id } 彻底删除 */
    async delete(body, db) {
      await run(db, `DELETE FROM ${cfg.table} WHERE _id = ?`, [body.id]);
      return RES.success('Succeed DELETE ' + cfg.table);
    },
  };
}
/* ============================ 路由表 ============================ */

const ROUTES = {
  // 键名保持与 api/*.js 的 info 请求值一致（见各自 switch case）
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
    // 原 api/income.js 全部为写操作
    insert: incomeWrites.insert,
    delete: incomeWrites.delete,
    update_type: incomeWrites.updateType,
    update_detail: incomeWrites.updateDetail,
  },
  bigType: { ...typeModuleHandler(bigTypeSelect), ...typeWriteHandler(BIG_TYPE_CFG) },
  smallType: { ...typeModuleHandler(smallTypeSelect), ...typeWriteHandler(SMALL_TYPE_CFG) },
  payBudget: {
    select_by_month: payBudget.selectByMonth,
    copy_by_month: payBudgetWrites.copyByMonth,
    insert: payBudgetWrites.insert,
    delete: payBudgetWrites.delete,
    update_type: payBudgetWrites.updateType,
    update_detail: payBudgetWrites.updateDetail,
  },
};