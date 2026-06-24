const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ───────── ПОЛУЧИТЬ ПРОФИЛЬ ─────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, role, birth_date, gender, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── ОБНОВИТЬ ПРОФИЛЬ ─────────
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const { full_name, phone, birth_date, gender, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET full_name  = COALESCE($1, full_name),
           phone      = COALESCE($2, phone),
           birth_date = COALESCE($3, birth_date),
           gender     = COALESCE($4, gender),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $6
       RETURNING id, email, full_name, phone, role, birth_date, gender, avatar_url, created_at`,
      [full_name || null, phone || null, birth_date || null, gender || null, avatar_url || null, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── СМЕНА ПАРОЛЯ ─────────
router.patch('/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Укажите текущий и новый пароль' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // Если пользователь зашёл через Google и у него нет пароля
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Аккаунт создан через Google — установите пароль через сброс' });
    }

    const passwordMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Текущий пароль неверный' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;