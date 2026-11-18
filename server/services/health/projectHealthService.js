import {
  calculateProjectHealth,
  evaluateProjectHealth,
} from './projectHealthEngine.js';
import {
  authenticateHealthUser,
  canUserBrowseProject,
  isUserPrivilegedOnProject,
} from './projectHealthPermissions.js';
import { runProjectHealthAiForSnapshot as defaultAiAnalyzer } from './projectHealthAiService.js';
import {
  getHealthHistorySnapshots,
  getLatestAiAnalysisSnapshot,
  getLatestAiSnapshotsByProjectIds,
  getLatestHealthSnapshot,
  getPreviousDistinctSnapshot,
  insertHealthSnapshot,
  mapSnapshotRow,
} from '../../repositories/projectHealthRepository.js';

export const computeScoreTrend = (currentScore, previousScore) => {
  if (currentScore == null || previousScore == null) {
    return { trend: 'NONE', scoreDelta: null };
  }
  const delta = Math.round((Number(currentScore) - Number(previousScore)) * 100) / 100;
  return { trend: delta > 0 ? 'UP' : delta < 0 ? 'DOWN' : 'FLAT', scoreDelta: delta };
};

const getDbFromDeps = async (deps) => deps?.db || (await import('../../config/db.js')).pool;

const EMPTY_AI_PREVIEW = { aiSummary: null, aiTopAction: null, aiAnalyzedAt: null };

const extractAiPreview = (aiSnap) => {
  const ai = aiSnap?.aiAnalysis;
  if (!ai || typeof ai !== 'object') return EMPTY_AI_PREVIEW;
  const aiSummary = typeof ai.summary === 'string' && ai.summary.trim() ? ai.summary.trim() : null;
  const rec = Array.isArray(ai.recommendations) ? ai.recommendations[0] : null;
  const aiTopAction = rec && typeof rec.action === 'string' ? rec.action.trim() : null;
  return { aiSummary, aiTopAction, aiAnalyzedAt: aiSnap?.aiAnalyzedAt || null };
};

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
  const { trend, scoreDelta } = computeScoreTrend(
    liveHealth.healthScore,
    prevSnapshot ? prevSnapshot.healthScore : null
  );

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
  return getHealthHistorySnapshots(db, projectId, Number(options.limit) || 30);
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

  const [projectsRes, workflowsRes, schemesRes, tasksRes, timesheetsRes, sprintsRes, snapshotsRes] =
    await Promise.all([
      db.query('SELECT * FROM projects'),
      db.query('SELECT * FROM project_workflows'),
      db.query('SELECT * FROM permission_schemes'),
      db.query('SELECT * FROM tasks'),
      db.query('SELECT * FROM timesheets WHERE COALESCE(is_personal, FALSE) = FALSE'),
      db.query('SELECT * FROM sprints'),
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

  const aiByProj = await getLatestAiSnapshotsByProjectIds(
    db,
    visibleProjects.map((p) => String(p.id))
  );

  const groupRows = (rows) => {
    const map = new Map();
    for (const r of rows) {
      const pid = r.project_id;
      const arr = map.get(pid) || [];
      arr.push(r);
      map.set(pid, arr);
    }
    return map;
  };

  const tasksByProj = groupRows(tasksRes.rows);
  const tsByProj = groupRows(timesheetsRes.rows);
  const sprintsByProj = groupRows(sprintsRes.rows);
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
      sprints: sprintsByProj.get(project.id) || [],
      referenceDate,
    });
    const recentSnaps = snapsByProj.get(project.id) || [];
    const baselineSnap = recentSnaps.length >= 2 ? recentSnaps[1] : recentSnaps[0];
    const { trend, scoreDelta } = computeScoreTrend(health.healthScore, baselineSnap?.healthScore ?? null);
    const canSeeAi = isUserPrivilegedOnProject(globalRole, project, uid);
    const aiFields = canSeeAi ? extractAiPreview(aiByProj.get(String(project.id))) : EMPTY_AI_PREVIEW;

    return { ...health, trend, scoreDelta, ...aiFields };
  });
};
