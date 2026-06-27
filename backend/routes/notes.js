const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ───────── ПОЛУЧИТЬ ВСЕ ЗАМЕТКИ ─────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, folder_id } = req.query;

    let query = `SELECT * FROM notes WHERE user_id = $1`;
    const params = [req.user.id];

    if (folder_id) {
      params.push(folder_id);
      query += ` AND folder_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    query += ` ORDER BY is_pinned DESC, updated_at DESC`;

    const result = await pool.query(query, params);
    res.json({ notes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── СОЗДАТЬ ЗАМЕТКУ ─────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, color, tags, folder_id } = req.body;

    if (!title) return res.status(400).json({ error: 'Заголовок обязателен' });

    const result = await pool.query(
      `INSERT INTO notes (user_id, folder_id, title, content, color, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, folder_id || null, title, content || '', color || '#ffffff', tags || []]
    );

    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── ОБНОВИТЬ ЗАМЕТКУ ─────────
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, color, tags, is_pinned, folder_id } = req.body;

    const result = await pool.query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           color = COALESCE($3, color),
           tags = COALESCE($4, tags),
           is_pinned = COALESCE($5, is_pinned),
           folder_id = COALESCE($6, folder_id),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, content, color, tags, is_pinned, folder_id, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    res.json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ───────── УДАЛИТЬ ЗАМЕТКУ ─────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Заметка удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;