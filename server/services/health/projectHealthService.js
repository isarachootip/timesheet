import {
  calculateProjectHealth,
  evaluateProjectHealth,
} from './projectHealthEngine.js';
import {
  authenticateHealthUser,
  canUserBrowseProject,
} from './projectHealthPermissions.js';
import { analyzeProjectHealth as defaultAiAnalyzer } from './projectHealthAiService.js';
import {
  getHealthHistorySnapshots,
  getLatestAiAnalysisSnapshot,
  getLatestHealthSnapshot,
  getPreviousDistinctSnapshot,
  insertHealthSnapshot,
  mapSnapshotRow,
} from '../../repositories/projectHealthRepository.js';

export const computeScoreTrend = (currentScore, previousScore) => {
  if (
    currentScore === null ||
    currentScore === undefined ||
    previousScore === null ||
    previousScore === undefined
  ) {
    return { trend: 'NONE', scoreDelta: null };
  }
  const delta = Math.round((Number(currentScore) - Number(previousScore)) * 100) / 100;
  if (delta > 0) return { trend: 'UP', scoreDelta: delta };
  if (delta < 0) return { trend: 'DOWN', scoreDelta: delta };
  return { trend: 'FLAT', scoreDelta: 0 };
};

const getDbFromDeps = async (deps) => deps?.db || (await import('../../config/db.js')).pool;

export const getProjectHealthLatest = async (deps, projectId) => {
  const db = await getDbFromDeps(deps);
  const referenceDate = deps?.referenceDate || new Date();
  const liveHealth = await calculateProjectHealth(projectId, { db, referenceDate });

  let latestSnapshot = await getLatestHealthSnapshot(db, projectId);
  if (!latestSnapshot) {
    latestSnapshot = await insertHealthSnapshot(db, {
      ...liveHealth,
      triggerSource: 'initial',
    });
  }

  const aiSource = latestSnapshot.aiAnalysis
    ? latestSnapshot
    : await getLatestAiAnalysisSnapshot(db, projectId);

  const prevSnapshot = await getPreviousDistinctSnapshot(db, projectId, latestSnapshot.id);
  const baselineScore = prevSnapshot ? prevSnapshot.healthScore : null;
  const { trend, scoreDelta } = computeScoreTrend(liveHealth.healthScore, baselineScore);

  return {
    ...liveHealth,
    snapshotId: latestSnapshot.id,
    trend,
    scoreDelta,
    aiAnalysis: aiSource?.aiAnalysis || null,
    aiAnalyzedAt: aiSource?.aiAnalyzedAt || null,
  };
};

export const getProjectHealthHistoryList = async (deps, projectId, options = {}) => {
  const db = await getDbFromDeps(deps);
  const limit = Number(options.limit) || 30;
  return getHealthHistorySnapshots(db, projectId, limit);
};

export const analyzeAndSaveProjectHealth = async (deps, projectId) => {
  const db = await getDbFromDeps(deps);
  const referenceDate = deps?.referenceDate || new Date();
  const aiAnalyzer = deps?.aiAnalyzer || defaultAiAnalyzer;

  const liveHealth = await calculateProjectHealth(projectId, { db, referenceDate });
  const prevSnapshot = await getLatestHealthSnapshot(db, projectId);

  let aiAnalysis = null;
  let aiError = null;
  try {
    aiAnalysis = await aiAnalyzer(projectId, liveHealth, { db, referenceDate });
  } catch (err) {
    aiError = err instanceof Error ? err.message : 'AI analysis unavailable.';
  }

  const savedSnapshot = await insertHealthSnapshot(db, {
    ...liveHealth,
    aiAnalysis,
    aiAnalyzedAt: aiAnalysis ? liveHealth.calculatedAt : null,
    triggerSource: 'manual_analyze',
  });

  const fallbackAi = !aiAnalysis ? await getLatestAiAnalysisSnapshot(db, projectId) : null;
  const { trend, scoreDelta } = computeScoreTrend(
    liveHealth.healthScore,
    prevSnapshot?.healthScore ?? null
  );

  return {
    ...liveHealth,
    snapshotId: savedSnapshot.id,
    trend,
    scoreDelta,
    aiAnalysis: savedSnapshot.aiAnalysis || fallbackAi?.aiAnalysis || null,
    aiAnalyzedAt: savedSnapshot.aiAnalyzedAt || fallbackAi?.aiAnalyzedAt || null,
    aiError,
  };
};

export const getAllVisibleProjectsHealth = async (deps, userId) => {
  const db = await getDbFromDeps(deps);
  const referenceDate = deps?.referenceDate || new Date();
  const { userId: uid, globalRole } = await authenticateHealthUser(db, userId);

  const [projectsRes, workflowsRes, schemesRes, tasksRes, timesheetsRes, snapshotsRes] =
    await Promise.all([
      db.query('SELECT * FROM projects'),
      db.query('SELECT * FROM project_workflows'),
      db.query('SELECT * FROM permission_schemes'),
      db.query('SELECT * FROM tasks'),
      db.query('SELECT * FROM timesheets WHERE COALESCE(is_personal, FALSE) = FALSE'),
      db.query(
        `SELECT * FROM (
           SELECT *, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY calculated_at DESC) AS rn
           FROM project_health_snapshots
         ) ranked WHERE rn <= 2`
      ),
    ]);

  const schemeMap = new Map(schemesRes.rows.map((s) => [s.id, s.permissions]));
  const wfMap = new Map(workflowsRes.rows.map((w) => [w.project_id, w]));

  const visibleProjects = projectsRes.rows.filter((proj) =>
    canUserBrowseProject(
      globalRole,
      proj,
      schemeMap.get(proj.permission_scheme_id || 'scheme_default') || null,
      uid
    )
  );

  const tasksByProj = new Map();
  for (const t of tasksRes.rows) {
    const arr = tasksByProj.get(t.project_id) || [];
    arr.push(t);
    tasksByProj.set(t.project_id, arr);
  }

  const tsByProj = new Map();
  for (const ts of timesheetsRes.rows) {
    const arr = tsByProj.get(ts.project_id) || [];
    arr.push(ts);
    tsByProj.set(ts.project_id, arr);
  }

  const snapsByProj = new Map();
  for (const r of snapshotsRes.rows) {
    const arr = snapsByProj.get(r.project_id) || [];
    arr.push(mapSnapshotRow(r));
    snapsByProj.set(r.project_id, arr);
  }

  return visibleProjects.map((project) => {
    const health = evaluateProjectHealth({
      project,
      workflow: wfMap.get(project.id) || null,
      tasks: tasksByProj.get(project.id) || [],
      timesheets: tsByProj.get(project.id) || [],
      referenceDate,
    });
    const recentSnaps = snapsByProj.get(project.id) || [];
    const baselineSnap = recentSnaps.length >= 2 ? recentSnaps[1] : recentSnaps[0];
    const { trend, scoreDelta } = computeScoreTrend(health.healthScore, baselineSnap?.healthScore ?? null);
    return { ...health, trend, scoreDelta };
  });
};
