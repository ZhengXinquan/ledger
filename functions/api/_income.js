/**
 * _income.js —— 收入记录（aa_income）的写操作
 *
 * 从原 worker.js 的 incomeWrites 模块拆分而来，对应历史接口 api/income.js。
 * 收入查询由 _accountBook.js 中的 selectByMonth / search 合并返回，无需独立查询入口。
 */
import { RES, run, newId, localNow, isoDay } from './_utils.js';

export const incomeWrites = {
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
  /** POST { id, tid: 大类 _id } 修改记录所属大类 */
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