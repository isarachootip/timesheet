import express from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';

export const mapRowToNote = (r) => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  content: r.content || '',
  noteDate: r.note_date,
  dueDate: r.due_date || '',
  color: r.color || 'yellow',
  isCompleted: Boolean(r.is_completed),
  workType: r.work_type || (r.project_id ? 'project' : 'personal'),
  projectId: r.project_id || undefined,
  taskId: r.task_id || undefined,
  timesheetId: r.timesheet_id || undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const linkTaskBodySchema = z.object({
  projectId: z.string().trim().min(1, 'projectId is required'),
  taskId: z.string().trim().min(1, 'taskId is required'),
});

export const executeLinkNoteToTask = async (db, { noteId, userId, body }) => {
  if (!userId || !String(userId).trim()) {
    const err = new Error('Missing user identification');
    err.statusCode = 400;
    throw err;
  }

  const parsed = linkTaskBodySchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues[0]?.message || 'Invalid link-task payload');
    err.statusCode = 400;
    throw err;
  }

  const result = await db.query(
    `UPDATE personal_notes
     SET project_id = $1,
         task_id = $2,
         work_type = 'project',
         updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [parsed.data.projectId, parsed.data.taskId, noteId, String(userId)]
  );

  if (result.rowCount === 0) {
    const err = new Error('Note not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  return mapRowToNote(result.rows[0]);
};

const router = express.Router();

router.patch('/api/notes/:id/link-timesheet', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] || req.body?.userId;
  const { timesheetId, markCompleted = true } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'Missing user identification' });
  }

  try {
    const result = await pool.query(
      `UPDATE personal_notes
       SET timesheet_id = $1,
           is_completed = CASE WHEN $2::boolean THEN TRUE ELSE is_completed END,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [timesheetId || null, Boolean(markCompleted), id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    return res.json(mapRowToNote(result.rows[0]));
  } catch (err) {
    console.error('Error linking timesheet to note:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/api/notes/:id/link-task', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] || req.body?.userId;

  try {
    const note = await executeLinkNoteToTask(pool, {
      noteId: id,
      userId,
      body: req.body,
    });
    return res.json(note);
  } catch (err) {
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
    return res.status(status).json({ error: err.message });
  }
});

export default router;
