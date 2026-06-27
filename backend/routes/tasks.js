const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ───────── ПОЛУЧИТЬ ВСЕ ЗАДАЧИ ─────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { done, priority, folder_id } = req.query;

    let query = `SELECT * FROM tasks WHERE user_id = $1`;
    const params = [req.user.id];

    if (done !== undefined) {
      params.push(done === 'true');
      query += ` AND is_done = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      query += ` AND priority = $${params.length}`;
    }

    if (folder_id) {
      params.push(folder_id);
      query += ` AND folder_id = $${params.length}`;
    }

    query += ` ORDER BY is_done ASC, priority DESC, deadline ASC NULLS LAST`;

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── СОЗДАТЬ ЗАДАЧУ ─────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, deadline, folder_id } = req.body;

    if (!title) return res.status(400).json({ error: 'Заголовок обязателен' });

    const result = await pool.query(
      `INSERT INTO tasks (user_id, folder_id, title, description, priority, deadline)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, folder_id || null, title, description || '', priority || 'medium', deadline || null]
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── ОТМЕТИТЬ ВЫПОЛНЕННОЙ / ОБНОВИТЬ ─────────
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, is_done, priority, deadline } = req.body;

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_done = COALESCE($3, is_done),
           priority = COALESCE($4, priority),
           deadline = COALESCE($5, deadline)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, is_done, priority, deadline, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── УДАЛИТЬ ЗАДАЧУ ─────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Задача удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;