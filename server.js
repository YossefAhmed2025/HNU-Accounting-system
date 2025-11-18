// ملف: server.js
// تشغيل: node server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// Serve the front-end static files (folder is named `new front` in this repo)
app.use(express.static(path.join(__dirname, 'newfront')));

// إعداد اتصال MySQL — مُعدّل حسب طلبك
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'HNU',
  charset: 'utf8mb4'
};

async function getConn() {
  return await mysql.createConnection(dbConfig);
}

// --- API: جلب كل الحسابات
app.get('/api/accounts', async (req, res) => {
  try {
    const conn = await getConn();
    const [rows] = await conn.execute('SELECT * FROM accounts ORDER BY id');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

// --- API: إضافة حساب جديد
app.post('/api/accounts', async (req, res) => {
  try {
    const { name, opening_balance, balance_type } = req.body;
    const conn = await getConn();
    const [result] = await conn.execute(
      'INSERT INTO accounts (name, opening_balance, balance_type) VALUES (?, ?, ?)',
      [name, opening_balance || 0, balance_type || 'debit']
    );
    await conn.end();
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الإضافة' });
  }
});

// --- API: إضافة قيد يومي
app.post('/api/entries', async (req, res) => {
  try {
    const { entry_date, debit_account_id, credit_account_id, amount, description } = req.body;
    if (!entry_date || !debit_account_id || !credit_account_id || !amount) {
      return res.status(400).json({ error: 'مطلوب: التاريخ، الحساب المدين، الحساب الدائن، المبلغ' });
    }
    const conn = await getConn();
    const [result] = await conn.execute(
      'INSERT INTO entries (entry_date, debit_account_id, credit_account_id, amount, description) VALUES (?, ?, ?, ?, ?)',
      [entry_date, debit_account_id, credit_account_id, amount, description || '']
    );
    await conn.end();
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في إضافة القيد' });
  }
});

// --- API: جلب القيود (فلترة بالتاريخ)
app.get('/api/entries', async (req, res) => {
  try {
    const { from, to } = req.query; // yyyy-mm-dd
    let sql = 'SELECT e.*, a1.name AS debit_name, a2.name AS credit_name FROM entries e JOIN accounts a1 ON e.debit_account_id = a1.id JOIN accounts a2 ON e.credit_account_id = a2.id';
    const params = [];
    if (from && to) {
      sql += ' WHERE e.entry_date BETWEEN ? AND ?';
      params.push(from, to);
    } else if (from) {
      sql += ' WHERE e.entry_date >= ?';
      params.push(from);
    } else if (to) {
      sql += ' WHERE e.entry_date <= ?';
      params.push(to);
    }
    sql += ' ORDER BY e.entry_date, e.id';

    const conn = await getConn();
    const [rows] = await conn.execute(sql, params);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب القيود' });
  }
});

// --- API: حساب دفتر الأستاذ
app.get('/api/ledger', async (req, res) => {
  try {
    const conn = await getConn();
    const [accounts] = await conn.execute('SELECT * FROM accounts');
    const [debits] = await conn.execute(
      'SELECT debit_account_id AS account_id, SUM(amount) AS total_debit FROM entries GROUP BY debit_account_id'
    );
    const [credits] = await conn.execute(
      'SELECT credit_account_id AS account_id, SUM(amount) AS total_credit FROM entries GROUP BY credit_account_id'
    );

    const debitMap = {};
    debits.forEach(d => { debitMap[d.account_id] = Number(d.total_debit); });
    const creditMap = {};
    credits.forEach(c => { creditMap[c.account_id] = Number(c.total_credit); });

    const result = accounts.map(acc => {
      const total_debit = debitMap[acc.id] || 0;
      const total_credit = creditMap[acc.id] || 0;
      let opening = Number(acc.opening_balance || 0);
      if (acc.balance_type === 'credit') {
        opening = -Math.abs(opening);
      }
      const net_movements = total_debit - total_credit;
      const final_balance_value = opening + net_movements;
      const final_type = final_balance_value >= 0 ? 'debit' : 'credit';
      return {
        id: acc.id,
        name: acc.name,
        opening_balance: Number(acc.opening_balance || 0),
        opening_type: acc.balance_type,
        total_debit,
        total_credit,
        final_balance: Math.abs(final_balance_value),
        final_type
      };
    });

    await conn.end();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في حساب دفتر الأستاذ' });
  }
});

// Serve frontend index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'newfront', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
