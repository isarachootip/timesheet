import { resolveProjectHealthConfig } from '../../config/projectHealthConfig.js';
import { clamp, round2, toUtcDayMs } from './dateUtils.js';
import { buildTaskRollup, resolveWorkflowColumns } from './taskRollupUtils.js';
import {
  calculateEffortFactor,
  calculateFreshnessFactor,
  calculateMomentumFactor,
  calculateOverdueFactor,
  calculateScheduleFactor,
  mergeDataIssues,
} from './factorCalculators.js';
import { calculateSprintFactor } from './sprintFactorCalculator.js';

const FACTOR_KEYS = ['schedule', 'overdue', 'effort', 'momentum', 'freshness', 'sprint'];

const resolveStatusFromScore = (score, thresholds) => {
  if (score >= thresholds.greenMin) return 'GREEN';
  if (score >= thresholds.yellowMin) return 'YELLOW';
  return 'RED';
};

const resolveConfidence = (issueCount, activeWeightSum, thresholds) => {
  if (activeWeightSum <= 0) return 'LOW';
  if (issueCount > thresholds.mediumMaxIssues) return 'LOW';
  if (issueCount > thresholds.highMaxIssues) return 'MEDIUM';
  return 'HIGH';
};

export const evaluateProjectHealth = (input, configOverrides = {}) => {
  const {
    project,
    workflow = null,
    tasks = [],
    timesheets = [],
    sprints = [],
    referenceDate = new Date(),
  } = input;

  if (!project || !project.id) {
    throw new Error('evaluateProjectHealth requires a valid project object with an id.');
  }

  const config = resolveProjectHealthConfig(configOverrides);
  const nowDate = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const todayUtcMs = toUtcDayMs(nowDate) ?? Date.now();
  const calculatedAt = nowDate.toISOString();

  const rollup = buildTaskRollup(project, workflow, tasks, config);
  const columns = resolveWorkflowColumns(project, workflow);
  const isStatusCompleted = String(project.status || '').trim().toLowerCase() === 'completed';

  if (isStatusCompleted || rollup.allTasksDone) {
    return {
      projectId: String(project.id),
      calculatedAt,
      healthScore: null,
      overallProgress: isStatusCompleted && rollup.leafTasks.length === 0 ? 100 : round2(rollup.overallProgressRatio * 100),
      status: 'COMPLETED',
      confidence: 'HIGH',
      factors: {
        schedule: null,
        overdue: null,
        effort: null,
        momentum: null,
        freshness: null,
        sprint: null,
      },
      factorDetails: {},
      dataIssues: [],
    };
  }

  const scheduleRes = calculateScheduleFactor({ project, rollup, todayUtcMs, config });
  const overdueRes = calculateOverdueFactor({ rollup, todayUtcMs });
  const effortRes = calculateEffortFactor({ rollup, timesheets, config });
  const momentumRes = calculateMomentumFactor({ project, rollup, todayUtcMs, config });
  const freshnessRes = calculateFreshnessFactor({ tasks, timesheets, todayUtcMs, config });
  const sprintRes = calculateSprintFactor({ sprints, rawTasks: tasks, columns, config, todayUtcMs });

  const factors = {
    schedule: scheduleRes.score,
    overdue: overdueRes.score,
    effort: effortRes.score,
    momentum: momentumRes.score,
    freshness: freshnessRes.score,
    sprint: sprintRes.score,
  };

  const factorDetails = {
    schedule: scheduleRes.details,
    overdue: overdueRes.details,
    effort: effortRes.details,
    momentum: momentumRes.details,
    freshness: freshnessRes.details,
    sprint: sprintRes.details,
  };

  const dataIssues = mergeDataIssues([
    scheduleRes.issues,
    overdueRes.issues,
    effortRes.issues,
    momentumRes.issues,
    freshnessRes.issues,
    sprintRes.issues,
  ]);

  let weightedSum = 0;
  let activeWeightSum = 0;
  for (const key of FACTOR_KEYS) {
    const score = factors[key];
    const weight = Number(config.weights[key]) || 0;
    if (score !== null && weight > 0) {
      weightedSum += score * weight;
      activeWeightSum += weight;
    }
  }

  const healthScore = activeWeightSum > 0 ? clamp(Math.round(weightedSum / activeWeightSum), 0, 100) : 0;
  const status = resolveStatusFromScore(healthScore, config.statusThresholds);
  const confidence = resolveConfidence(dataIssues.length, activeWeightSum, config.confidenceThresholds);

  return {
    projectId: String(project.id),
    calculatedAt,
    healthScore,
    overallProgress: round2(rollup.overallProgressRatio * 100),
    status,
    confidence,
    factors,
    factorDetails,
    dataIssues,
  };
};

export const calculateProjectHealth = async (projectId, options = {}) => {
  const db = options.db || (await import('../../config/db.js')).pool;
  const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projectRes.rows.length === 0) {
    const err = new Error(`Project "${projectId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  const [workflowRes, tasksRes, timesheetsRes, sprintsRes] = await Promise.all([
    db.query('SELECT * FROM project_workflows WHERE project_id = $1', [projectId]),
    db.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]),
    db.query('SELECT * FROM timesheets WHERE project_id = $1 AND COALESCE(is_personal, FALSE) = FALSE', [projectId]),
    db.query('SELECT * FROM sprints WHERE project_id = $1', [projectId]),
  ]);

  return evaluateProjectHealth(
    {
      project: projectRes.rows[0],
      workflow: workflowRes.rows[0] || null,
      tasks: tasksRes.rows,
      timesheets: timesheetsRes.rows,
      sprints: sprintsRes.rows,
      referenceDate: options.referenceDate || new Date(),
    },
    options.config || {}
  );
};
