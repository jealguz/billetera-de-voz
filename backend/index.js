require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool, get, all, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

app.use(bodyParser.json());
app.use(require('cors')({ origin: true, credentials: true }));

(async () => {
  // Initialize tables (PostgreSQL syntax)
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
})();

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // { id, email }
    next();
  });
}

// Auth routes
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const existing = await get('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const result = await run('INSERT INTO users (email, passwordHash, createdAt) VALUES ($1, $2, $3) RETURNING id', [email, hash, now]);
    const user = { id: result.lastID, email };
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await get('SELECT id, email, passwordHash FROM users WHERE email = $1', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Wallet routes
app.get('/wallets', authMiddleware, async (req, res) => {
  try {
    const wallets = await all('SELECT * FROM wallets WHERE userId = $1', [req.user.id]);
    res.json({ wallets });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/wallets', authMiddleware, async (req, res) => {
  const { name, type, balance } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = await run('INSERT INTO wallets (userId, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING id', [req.user.id, name, type || '', balance || 0]);
    const wallet = await get('SELECT * FROM wallets WHERE id = $1', [result.lastID]);
    res.json({ wallet });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/wallets/:walletId/transactions', authMiddleware, async (req, res) => {
  const walletId = parseInt(req.params.walletId, 10);
  try {
    const wallet = await get('SELECT * FROM wallets WHERE id = $1 AND userId = $2', [walletId, req.user.id]);
    if (!wallet) return res.status(403).json({ error: 'Access denied' });
    const txs = await all('SELECT * FROM transactions WHERE walletId = $1 ORDER BY date DESC', [walletId]);
    res.json({ transactions: txs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/wallets/:walletId/transactions', authMiddleware, async (req, res) => {
  const walletId = parseInt(req.params.walletId, 10);
  const { amount, type, description } = req.body;
  if (typeof amount !== 'number' || !type) {
    return res.status(400).json({ error: 'Amount and type are required' });
  }
  try {
    const wallet = await get('SELECT * FROM wallets WHERE id = $1 AND userId = $2', [walletId, req.user.id]);
    if (!wallet) return res.status(403).json({ error: 'Access denied' });
    const date = new Date().toISOString();
    await run('INSERT INTO transactions (walletId, date, amount, type, description) VALUES ($1, $2, $3, $4, $5)', [walletId, date, amount, type, description || '']);
    // Update balance based on type
    const delta = (type === 'credit') ? amount : -amount;
    await run('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [delta, walletId]);
    const updatedWallet = await get('SELECT * FROM wallets WHERE id = $1', [walletId]);
    res.json({ wallet: updatedWallet });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
