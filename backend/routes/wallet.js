const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ───────── ПОЛУЧИТЬ ИЛИ СОЗДАТЬ КОШЕЛЁК ─────────
async function getOrCreateWallet(userId) {
  let result = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await pool.query(
      'INSERT INTO wallets (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
  }
  return result.rows[0];
}

// ───────── ПОЛУЧИТЬ БАЛАНС И ИСТОРИЮ ─────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);

    const transactions = await pool.query(
      `SELECT * FROM transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [wallet.id]
    );

    res.json({
      balance: wallet.balance,
      transactions: transactions.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── ПОПОЛНЕНИЕ ─────────
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть больше нуля' });
    }

    const wallet = await getOrCreateWallet(req.user.id);

    // Обновляем баланс и создаём транзакцию атомарно
    await pool.query('BEGIN');

    const updatedWallet = await pool.query(
      'UPDATE wallets SET balance = balance + $1 WHERE id = $2 RETURNING *',
      [amount, wallet.id]
    );

    await pool.query(
      'INSERT INTO transactions (wallet_id, type, amount, description) VALUES ($1, $2, $3, $4)',
      [wallet.id, 'deposit', amount, description || 'Пополнение']
    );

    await pool.query('COMMIT');

    res.json({
      balance: updatedWallet.rows[0].balance,
      message: `Баланс пополнен на ${amount} ₸`,
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── СПИСАНИЕ ─────────
router.post('/withdrawal', authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть больше нуля' });
    }

    const wallet = await getOrCreateWallet(req.user.id);

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Недостаточно средств' });
    }

    await pool.query('BEGIN');

    const updatedWallet = await pool.query(
      'UPDATE wallets SET balance = balance - $1 WHERE id = $2 RETURNING *',
      [amount, wallet.id]
    );

    await pool.query(
      'INSERT INTO transactions (wallet_id, type, amount, description) VALUES ($1, $2, $3, $4)',
      [wallet.id, 'withdrawal', amount, description || 'Списание']
    );

    await pool.query('COMMIT');

    res.json({
      balance: updatedWallet.rows[0].balance,
      message: `Списано ${amount} ₸`,
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;