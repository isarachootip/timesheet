import express from 'express';
import { pool } from '../config/db.js';
import { checkPermission, validateTransition } from './projectRoutes.js';
import {
  bulkTasksUpdateSchema,
  bulkProjectsUpdateSchema,
} from '../schemas/bulkUpdateSchemas.js';
import {
  executeBulkTasksUpdate,
  executeBulkProjectsUpdate,
} from '../services/bulkUpdateService.js';

const router = express.Router();

const formatZodError = (zodError) =>
  zodError.issues.map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ');

router.post('/api/tasks/bulk-update', async (req, res) => {
  const parsed = bulkTasksUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) });
  }

  const userId = String(req.headers['x-user-id'] || '');
  try {
    const result = await executeBulkTasksUpdate(
      { pool, checkPermission, validateTransition },
      userId,
      parsed.data
    );
    return res.json(result);
  } catch (err) {
    const status = err && typeof err.statusCode === 'number' ? err.statusCode : 500;
    return res.status(status).json({ error: err instanceof Error ? err.message : 'Bulk task update failed.' });
  }
});

router.post('/api/projects/bulk-update', async (req, res) => {
  const parsed = bulkProjectsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) });
  }

  const userId = String(req.headers['x-user-id'] || '');
  try {
    const result = await executeBulkProjectsUpdate({ pool }, userId, parsed.data);
    return res.json(result);
  } catch (err) {
    const status = err && typeof err.statusCode === 'number' ? err.statusCode : 500;
    return res.status(status).json({ error: err instanceof Error ? err.message : 'Bulk project update failed.' });
  }
});

export default router;
