/**
 * _payBudget.js —— 预算（aa_pay_budget）
 *
 * 从原 worker.js 的 payBudget / payBudgetWrites 模块拆分而来：
 *   - selectByMonth：某月预算列表（join 小类/大类，附当月实际支出 pm 与结余 lm）
 *   - 写操作：复制（copyByMonth）/ 新增（insert）/ 删除（delete）
 *     / 改分类（updateType）/ 改金额与月份（updateDetail）
 */
import { RES, query, run, newId, localNow, isoDay, prevMonth } from './_utils.js';

export const payBudget = {
  /**
   * 某月预算列表（附当月实际支出 pm 与结余 lm）
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

/* 预算的增删改 + 复制（与 api/payBudget.js 字段一一对应） */
export const payBudgetWrites = {
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