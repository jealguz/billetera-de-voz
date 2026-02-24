// Optional bootstrap to ensure DB exists and tables are created
const { run } = require('./db');

(async () => {
  try {
    await run(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL
    )`);
    await run(`CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      balance NUMERIC DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);
    await run(`CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      walletId INTEGER NOT NULL,
      date TIMESTAMP,
      amount NUMERIC,
      type TEXT,
      description TEXT,
      FOREIGN KEY(walletId) REFERENCES wallets(id)
    )`);
    console.log('DB schema ensured (backend/init-db.js)');
  } catch (e) {
    console.error('Init DB error', e);
  }
})();
