import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

const mapRowToNote = (r) => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  content: r.content || '',
  noteDate: r.note_date,
  dueDate: r.due_date || '',
  color: r.color || 'yellow',
  isCompleted: Boolean(r.is_completed),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

// GET /api/notes - fetch notes for user
router.get('/api/notes', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing user identification' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM personal_notes 
       WHERE user_id = $1 
       ORDER BY is_completed ASC, due_date ASC NULLS LAST, created_at DESC`,
      [userId]
    );
    res.json(result.rows.map(mapRowToNote));
  } catch (err) {
    console.error('Error fetching personal notes:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes - create or update a note
router.post('/api/notes', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  const { id, title, content, noteDate, dueDate, color, isCompleted } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user identification' });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const noteId = id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalDate = noteDate || new Date().toISOString().split('T')[0];
  const finalColor = color || 'yellow';
  const finalCompleted = Boolean(isCompleted);

  try {
    const result = await pool.query(
      `INSERT INTO personal_notes 
        (id, user_id, title, content, note_date, due_date, color, is_completed, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO UPDATE SET 
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         note_date = EXCLUDED.note_date,
         due_date = EXCLUDED.due_date,
         color = EXCLUDED.color,
         is_completed = EXCLUDED.is_completed,
         updated_at = NOW()
       RETURNING *`,
      [noteId, userId, title.trim(), content || '', finalDate, dueDate || null, finalColor, finalCompleted]
    );

    res.json(mapRowToNote(result.rows[0]));
  } catch (err) {
    console.error('Error saving personal note:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notes/:id/toggle - toggle completion status
router.patch('/api/notes/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] || req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user identification' });
  }

  try {
    const result = await pool.query(
      `UPDATE personal_notes 
       SET is_completed = NOT is_completed, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    res.json(mapRowToNote(result.rows[0]));
  } catch (err) {
    console.error('Error toggling personal note:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id - delete a note
router.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user identification' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM personal_notes WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting personal note:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
