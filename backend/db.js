// PostgreSQL wrapper using pg
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });

function translate(sql) {
  // Simple placeholder translator: '?' -> '$1', '$2', ...
  let idx = 0;
  return sql.replace(/\?/g, () => '$' + (++idx));
}

async function all(sql, params = []) {
  const text = translate(sql);
  const res = await pool.query(text, params);
  return res.rows;
}

async function get(sql, params = []) {
  const text = translate(sql);
  const res = await pool.query(text, params);
  return res.rows[0];
}

async function run(sql, params = []) {
  const text = translate(sql);
  const res = await pool.query(text, params);
  // If INSERT/RETURNING id is used, lastID will be in res.rows[0].id
  const lastID = res.rows && res.rows[0] && ('id' in res.rows[0]) ? res.rows[0].id : null;
  return { lastID, changes: res.rowCount };
}

function translatePublic(sql) { return translate(sql); }

module.exports = {
  pool,
  all,
  get,
  run,
  translate: translatePublic
};
