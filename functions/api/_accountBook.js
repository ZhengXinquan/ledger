/**
 * _accountBook.js —— 支出明细（aa_account_book）+ 月度收入/支出合并查询
 *
 * 从原 worker.js 的 accountBook / accountBookWrites 模块拆分而来，提供：
 *   - 查询：按年统计（selectBillByYear）、小类/全局的周月年明细
 *     （selectPayDetailBySidAndTime / selectPayDetailByTime）、
 *     当月收入+支出合并（selectByMonth）、条件搜索（search）
 *   - 写操作：新增 / 删除 / 改分类 / 改明细（insert/delete/updateType/updateDetail）
 */
import { RES, query, run, timeCond, dayRange, sortByDT, newId, localNow, isoDay } from './_utils.js';

/** 支出明细查询公共 SQL 头部（join 小类、大类） */
const PAY_DETAIL_STAR =
  `SELECT ab._id AS id, st._id AS tid, st.sname AS tn, b._id AS bid, b.bname AS bn, ` +
  `ab.aname AS n, ab.amoney AS m, ` +
  `strftime('%Y-%m-%d', ab._aday, '+8 hours') AS d, ` +
  `strftime('%Y-%m-%d %H:%M:%S', ab._atime, '+8 hours') AS t ` +
  `FROM aa_account_book ab ` +
  `JOIN aa_small_type st ON st._id = ab._sid ` +
  `JOIN aa_big_type b ON b._id = st._bid `;

export const accountBook = {
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
      return { d, pay: p, income: inc, budget: bud, lincome: inc - p, lbudget: bud - p };
    });

    let paySum = 0, incomeSum = 0, budgetSum = 0, lincomeSum = 0, lbudgetSum = 0;
    for (const e of list) {
      paySum += e.pay;
      incomeSum += e.income;
      budgetSum += e.budget;
      lincomeSum += e.lincome;
      lbudgetSum += e.lbudget;
    }
    return RES.success({ d: list, pay: paySum, income: incomeSum, budget: budgetSum, lincome: lincomeSum, lbudget: lbudgetSum });
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

/** 支出明细的增删改（与原 api/accountBook.js 字段一一对应） */
export const accountBookWrites = {
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