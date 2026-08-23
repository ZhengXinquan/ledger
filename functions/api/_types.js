/**
 * _types.js —— 大类（aa_big_type）/ 小类（aa_small_type）
 *
 * 从原 worker.js 的 bigType / smallType 模块拆分而来：
 *   - 查询：4 个变体（收入/支出 × 只取显示项/全部），由 typeModuleHandler 生成
 *   - 写操作：新增 / 改名 / 排序 / 批量排序 / 显示 / 隐藏 / 删除，由 typeWriteHandler 生成
 */
import { RES, query, run, newId } from './_utils.js';

/** 大类查询 SQL（别名 align 前端：id / n / bn / s / i） */
function bigTypeSelect(btype, showOnly) {
  return `SELECT _id AS id, bname AS n, bname AS bn, bshow AS s, bpx AS i
          FROM aa_big_type
          WHERE btype = ?${showOnly ? ' AND bshow = ?' : ''}
          ORDER BY bpx DESC, _id ASC`;
}

/** 小类查询 SQL（join 大类，带大类名/类型） */
function smallTypeSelect(btype, showOnly) {
  return `SELECT s._id AS id, s._bid AS bid, s.sname AS n, s.sshow AS s, s.spx AS i,
                 b.btype AS t, b.bname AS bn
          FROM aa_small_type s
          JOIN aa_big_type b ON b._id = s._bid
          WHERE b.btype = ?${showOnly ? ' AND s.sshow = ?' : ''}
          ORDER BY s.spx DESC, s._id ASC`;
}

/** bigType / smallType 公用查询 handler（4 个 select 变体） */
function typeModuleHandler(sqlBuilder) {
  return {
    select_income: (b, db) => query(db, sqlBuilder(1, true), [1, 1]).then(RES.success),
    select_pay: (b, db) => query(db, sqlBuilder(2, true), [2, 1]).then(RES.success),
    select_all_income: (b, db) => query(db, sqlBuilder(1, false), [1]).then(RES.success),
    select_all_pay: (b, db) => query(db, sqlBuilder(2, false), [2]).then(RES.success),
  };
}

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

/* 对外导出：路由表直接展开使用（{ ...查询, ...写操作 }） */
export const bigTypeHandlers = { ...typeModuleHandler(bigTypeSelect), ...typeWriteHandler(BIG_TYPE_CFG) };
export const smallTypeHandlers = { ...typeModuleHandler(smallTypeSelect), ...typeWriteHandler(SMALL_TYPE_CFG) };