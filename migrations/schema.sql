-- =============================================================
-- ledger —— D1 数据库结构（schema）
-- 表结构与原 d1-export.sql（现 migrations/seed.sql）/ functions/*.js 完全一致。
-- 单独成文件便于“只建表 / 建表+灌数”两种初始化方式复用。
--
-- 字段约定：
--   _xx 前缀  = 面向 SQL 查询的“规范化字段”（ISO 时间串 / 主键引用），
--              存储端一切按 UTC 零点（_aday/_iday/_pmonth），读取端 strftime('...','+8 hours') 还原北京自然日；
--   无前缀 xx = 历史展示口径（如 aday 为 'YYYY/MM/DD'），部分兼容旧数据保留。
-- 初始化：npm run db:local-init
-- =============================================================

CREATE TABLE IF NOT EXISTS aa_big_type (
  _id TEXT PRIMARY KEY,
  id INTEGER,
  bname TEXT,
  btype INTEGER,
  bshow INTEGER,
  bpx INTEGER
);

CREATE TABLE IF NOT EXISTS aa_small_type (
  _id TEXT PRIMARY KEY,
  id INTEGER,
  bid INTEGER,
  sname TEXT,
  sshow INTEGER,
  spx INTEGER,
  _bid TEXT
);

CREATE TABLE IF NOT EXISTS aa_income (
  _id TEXT PRIMARY KEY,
  id INTEGER,
  bid TEXT,
  iname TEXT,
  iday TEXT,
  itime TEXT,
  cid INTEGER,
  imoney INTEGER,
  _bid TEXT,
  _iday TEXT,
  _itime TEXT
);

CREATE TABLE IF NOT EXISTS aa_pay_budget (
  _id TEXT PRIMARY KEY,
  id INTEGER,
  sid TEXT,
  pmoney INTEGER,
  pmonth TEXT,
  ptime TEXT,
  cid INTEGER,
  _sid TEXT,
  _pmonth TEXT,
  _ptime TEXT
);

CREATE TABLE IF NOT EXISTS aa_account_book (
  _id TEXT PRIMARY KEY,
  id INTEGER,
  sid TEXT,
  aname TEXT,
  amoney REAL,
  aday TEXT,
  atime TEXT,
  cid INTEGER,
  _sid TEXT,
  _aday TEXT,
  _atime TEXT,
  aday_ TEXT
);