import express from 'express';
import { pool } from '../config/db.js';
import {
  healthHistoryQuerySchema,
  projectIdParamSchema,
} from '../schemas/projectHealthSchemas.js';
import {
  assertCanAnalyzeProjectHealth,
  assertCanViewProjectHealth,
} from '../services/health/projectHealthPermissions.js';
import {
  analyzeAndSaveProjectHealth,
  getAllVisibleProjectsHealth,
  getProjectHealthHistoryList,
  getProjectHealthLatest,
} from '../services/health/projectHealthService.js';

const router = express.Router();

const formatZodIssues = (zodErr) =>
  zodErr.issues.map((i) => `${i.path.join('.') || 'param'}: ${i.message}`).join('; ');

const sendRouteError = (res, err, fallbackMsg) => {
  const status = err && typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : fallbackMsg;
  return res.status(status).json({ error: message });
};

// Bulk summary for Dashboard ProjectHealthTable (avoids N+1 queries)
router.get('/api/projects/health', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');
  try {
    const items = await getAllVisibleProjectsHealth({ db: pool }, userId);
    return res.json(items);
  } catch (err) {
    return sendRouteError(res, err, 'Failed to fetch projects health summary.');
  }
});

// Latest health result for a single project
router.get(['/api/projects/:id/health', '/projects/:id/health'], async (req, res, next) => {
  // Allow SPA React Router to handle direct browser navigation to /projects/:id/health
  if (!req.path.startsWith('/api/') && String(req.headers.accept || '').includes('text/html')) {
    return next();
  }

  const paramCheck = projectIdParamSchema.safeParse(req.params);
  if (!paramCheck.success) {
    return res.status(400).json({ error: formatZodIssues(paramCheck.error) });
  }

  const userId = String(req.headers['x-user-id'] || '');
  try {
    await assertCanViewProjectHealth(pool, userId, paramCheck.data.id);
    const result = await getProjectHealthLatest({ db: pool }, paramCheck.data.id);
    return res.json(result);
  } catch (err) {
    return sendRouteError(res, err, 'Failed to fetch project health.');
  }
});

// Historical snapshots for trend chart
router.get(
  ['/api/projects/:id/health/history', '/projects/:id/health/history'],
  async (req, res, next) => {
    if (!req.path.startsWith('/api/') && String(req.headers.accept || '').includes('text/html')) {
      return next();
    }

    const paramCheck = projectIdParamSchema.safeParse(req.params);
    if (!paramCheck.success) {
      return res.status(400).json({ error: formatZodIssues(paramCheck.error) });
    }
    const queryCheck = healthHistoryQuerySchema.safeParse(req.query);
    if (!queryCheck.success) {
      return res.status(400).json({ error: formatZodIssues(queryCheck.error) });
    }

    const userId = String(req.headers['x-user-id'] || '');
    try {
      await assertCanViewProjectHealth(pool, userId, paramCheck.data.id);
      const history = await getProjectHealthHistoryList(
        { db: pool },
        paramCheck.data.id,
        queryCheck.data
      );
      return res.json(history);
    } catch (err) {
      return sendRouteError(res, err, 'Failed to fetch project health history.');
    }
  }
);

// Recalculate + trigger AI analysis
router.post(
  ['/api/projects/:id/health/analyze', '/projects/:id/health/analyze'],
  async (req, res) => {
    const paramCheck = projectIdParamSchema.safeParse(req.params);
    if (!paramCheck.success) {
      return res.status(400).json({ error: formatZodIssues(paramCheck.error) });
    }

    const userId = String(req.headers['x-user-id'] || '');
    try {
      await assertCanAnalyzeProjectHealth(pool, userId, paramCheck.data.id);
      const analyzed = await analyzeAndSaveProjectHealth({ db: pool }, paramCheck.data.id);
      return res.json(analyzed);
    } catch (err) {
      return sendRouteError(res, err, 'Failed to analyze project health.');
    }
  }
);

export default router;
