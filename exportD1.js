/**
 * exportD1.js —— MongoDB → Cloudflare D1(SQLite) 导出脚本
 *
 * 作用：
 *   只读导出 MongoDB（库 hdm189315162_db，连接见 ./api/class/utils.js）6 个集合的全量数据，
 *   按 MONGODB_TO_D1.md 的类型映射，生成可导入 Cloudflare D1 的 SQL 文件。
 *
 * 只读保证：
 *   仅使用 collection.find({}).toArray() 读取数据，不执行任何 insert / update / delete，
 *   从连接建立到断开都不会修改 MongoDB 中的数据。
 *
 * 表结构：
 *   动态生成 —— 列 = 该集合所有文档中出现的字段并集（_id 放在首位并作主键），
 *   类型自动推断（全为整数 → INTEGER，含小数 → REAL，其余 → TEXT），
 *   因此不会遗漏数据中任何字段（如历史遗留的 id、aday_ 等）。
 *
 * 用法：
 *   node exportD1.js                    # 生成 ./d1-export.sql（仅业务表）
 *   node exportD1.js out.sql            # 生成到指定文件
 *   node exportD1.js --with-log         # 额外导出 aa_log（数据量可能巨大，谨慎）
 */
const fs = require('fs');
const path = require('path');
const { client, ObjectId } = require('./api/class/utils');

const DB_NAME = 'hdm189315162_db';

// 业务集合（默认导出）
const BUSINESS_COLLECTIONS = [
  'aa_big_type',
  'aa_small_type',
  'aa_income',
  'aa_pay_budget',
  'aa_account_book'
];

// aa_log 是操作日志集合，数据量可能非常大，默认不导出；
// 传入 --with-log 才会读取并导出（全量读取，耗时取决于日志量，请谨慎）。
const LOG_COLLECTION = 'aa_log';

// 索引建议（仅当对应表和列实际存在时生成，与 MONGODB_TO_D1.md 一致）
const INDEX_PLANS = [
  ['idx_account_book_sid', 'aa_account_book', '_sid'],
  ['idx_account_book_aday', 'aa_account_book', '_aday'],
  ['idx_small_type_bid', 'aa_small_type', '_bid'],
  ['idx_income_bid', 'aa_income', '_bid'],
  ['idx_pay_budget_sid', 'aa_pay_budget', '_sid']
];

/** 是否为 BSON 数值类型对象（Long / Int32 / Double 等） */
function isBsonNumber(v) {
  return !!v && typeof v === 'object' && v._bsontype && typeof v.toNumber === 'function';
}

function isNumberLike(v) {
  return typeof v === 'number' || typeof v === 'bigint' || isBsonNumber(v);
}

/**
 * BSON → SQLite 值转换（映射规则见 MONGODB_TO_D1.md 第 1 节）。
 * 返回可直接写入 INSERT 语句的 SQL 字面量（字符串带引号、数字裸值、null）。
 */
function toSqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (v instanceof Date) return quote(v.toISOString()); // 日期存 UTC ISO8601 文本
  if (v instanceof ObjectId) return quote(v.toString()); // _id/_bid/_sid/tid → 十六进制文本
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toString();
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'string') return quote(v);
  // BSON 数值类型（Long / Int32 / Double 等）
  if (isBsonNumber(v)) {
    const n = v.toNumber();
    return Number.isInteger(n) ? String(n) : n.toString();
  }
  // 嵌套对象/数组 → JSON 文本（如 aa_log.d）
  return quote(JSON.stringify(v));
}

/** SQL 字符串字面量：单引号包裹，内部单引号转义为两个单引号 */
function quote(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

/**
 * 动态推断列类型：_id 为主键 TEXT；
 * 该列所有非空值都是整数 → INTEGER，含小数 → REAL，其余（字符串/日期/对象） → TEXT。
 */
function inferType(name, docs) {
  if (name === '_id') return 'TEXT PRIMARY KEY';
  let allNum = true;
  let allInt = true;
  for (const doc of docs) {
    const v = doc[name];
    if (v === null || v === undefined) continue;
    if (!isNumberLike(v)) {
      allNum = false;
      break;
    }
    const n = typeof v === 'bigint' ? Number(v) : isBsonNumber(v) ? v.toNumber() : v;
    if (!Number.isInteger(n)) allInt = false;
  }
  if (!allNum) return 'TEXT';
  return allInt ? 'INTEGER' : 'REAL';
}

/**
 * 动态构建表结构：列 = 全部文档字段并集（_id 移到首位作主键）。
 * 返回 [列名, SQLite 类型] 数组。
 */
function buildSchema(docs) {
  const names = [];
  const seen = new Set();
  for (const doc of docs) {
    for (const k of Object.keys(doc)) {
      if (!seen.has(k)) {
        seen.add(k);
        names.push(k);
      }
    }
  }
  if (seen.has('_id')) {
    names.splice(names.indexOf('_id'), 1);
    names.unshift('_id');
  }
  return names.map(name => [name, inferType(name, docs)]);
}

/** 生成 CREATE TABLE 语句 */
function createTableSql(table, columns) {
  const defs = columns.map(([name, type]) => '  ' + name + ' ' + type);
  return 'CREATE TABLE IF NOT EXISTS ' + table + ' (\n' + defs.join(',\n') + '\n);';
}

/** 生成 INSERT 语句；列缺失时写入 NULL */
function insertSql(table, columns, doc) {
  const names = columns.map(([name]) => name);
  const vals = names.map(name =>
    Object.prototype.hasOwnProperty.call(doc, name) ? toSqlValue(doc[name]) : 'NULL'
  );
  return 'INSERT INTO ' + table + ' (' + names.join(', ') + ') VALUES (' + vals.join(', ') + ');';
}

async function main() {
  const args = process.argv.slice(2);
  const withLog = args.includes('--with-log');
  const outFile = args.find(a => a !== '--with-log') || 'd1-export.sql';
  const collections = withLog
    ? [...BUSINESS_COLLECTIONS, LOG_COLLECTION]
    : BUSINESS_COLLECTIONS;

  const conn = await client().connect(); // 仅建立连接
  const db = conn.db(DB_NAME);

  // 流式写法：逐行落盘，避免一次性拼大字符串
  const stream = fs.createWriteStream(outFile);
  const line = s => stream.write(s + '\n');

  line('-- MongoDB(hdm189315162_db) -> Cloudflare D1 SQLite 导出');
  line('-- 生成时间: ' + new Date().toISOString());
  line('-- 由 exportD1.js 生成（只读导出，未修改 MongoDB 数据）');
  line('-- 默认导出业务表；aa_log 仅在 --with-log 时导出，当前含 aa_log: ' + withLog);
  line('-- 注意：D1 不接受 SQL 层的 BEGIN/COMMIT 事务语句，故本文件不包裹事务；');
  line('--       每条语句独立执行，若中途失败需先清理再整体重导。');

  let total = 0;
  const schemaByName = {};
  for (const table of collections) {
    line('');
    line('-- ===================== ' + table + ' =====================');

    const docs = await db.collection(table).find({}).toArray(); // 只读查询
    const schema = buildSchema(docs);
    schemaByName[table] = schema.map(([name]) => name);

    line(createTableSql(table, schema));
    for (const doc of docs) {
      line(insertSql(table, schema, doc));
    }

    total += docs.length;
    console.log(
      table + ': ' + docs.length + ' rows, columns: [' + schema.map(([n]) => n).join(', ') + ']'
    );
  }

  line('');
  line('-- 索引');
  for (const [indexName, table, col] of INDEX_PLANS) {
    if (schemaByName[table] && schemaByName[table].includes(col)) {
      line('CREATE INDEX IF NOT EXISTS ' + indexName + ' ON ' + table + '(' + col + ');');
    }
  }

  line('');

  // 结束写入流，等待落盘完成
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
    stream.end();
  });
  await conn.close(); // 关闭连接
  console.log('已生成: ' + path.resolve(outFile) + '（共 ' + total + ' 条记录）');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('导出失败:', err);
    process.exit(1);
  });