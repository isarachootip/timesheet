const parseEnvNumber = (envVal, fallback) => {
  if (envVal === undefined || envVal === null || envVal === '') return fallback;
  const parsed = Number(envVal);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildDefaultProjectHealthConfig = (env = process.env) => ({
  weights: {
    schedule: parseEnvNumber(env.HEALTH_WEIGHT_SCHEDULE, 0.30),
    overdue: parseEnvNumber(env.HEALTH_WEIGHT_OVERDUE, 0.20),
    effort: parseEnvNumber(env.HEALTH_WEIGHT_EFFORT, 0.20),
    momentum: parseEnvNumber(env.HEALTH_WEIGHT_MOMENTUM, 0.15),
    freshness: parseEnvNumber(env.HEALTH_WEIGHT_FRESHNESS, 0.15),
    sprint: parseEnvNumber(env.HEALTH_WEIGHT_SPRINT, 0.15),
  },
  statusThresholds: {
    greenMin: parseEnvNumber(env.HEALTH_GREEN_MIN, 80),
    yellowMin: parseEnvNumber(env.HEALTH_YELLOW_MIN, 60),
  },
  taskStatusProgress: {
    todo: parseEnvNumber(env.HEALTH_PROGRESS_TODO, 0),
    inProgress: parseEnvNumber(env.HEALTH_PROGRESS_IN_PROGRESS, 0.40),
    review: parseEnvNumber(env.HEALTH_PROGRESS_REVIEW, 0.80),
    done: parseEnvNumber(env.HEALTH_PROGRESS_DONE, 1.00),
  },
  terminalStatuses: ['done', 'completed', 'closed', 'released'],
  schedule: {
    overduePenaltyPointsPerStep: parseEnvNumber(env.HEALTH_SCHEDULE_PENALTY_POINTS, 1),
    overduePenaltyDaysStep: parseEnvNumber(env.HEALTH_SCHEDULE_PENALTY_DAYS_STEP, 2),
  },
  momentum: {
    lookbackDays: parseEnvNumber(env.HEALTH_MOMENTUM_LOOKBACK_DAYS, 14),
  },
  freshness: {
    tiers: [
      { maxDays: parseEnvNumber(env.HEALTH_FRESHNESS_TIER1_DAYS, 7), score: parseEnvNumber(env.HEALTH_FRESHNESS_TIER1_SCORE, 100) },
      { maxDays: parseEnvNumber(env.HEALTH_FRESHNESS_TIER2_DAYS, 14), score: parseEnvNumber(env.HEALTH_FRESHNESS_TIER2_SCORE, 70) },
      { maxDays: parseEnvNumber(env.HEALTH_FRESHNESS_TIER3_DAYS, 30), score: parseEnvNumber(env.HEALTH_FRESHNESS_TIER3_SCORE, 40) },
    ],
    staleScore: parseEnvNumber(env.HEALTH_FRESHNESS_STALE_SCORE, 0),
  },
  timesheetValidStatuses: ['Approved', 'Pending'],
  confidenceThresholds: {
    highMaxIssues: parseEnvNumber(env.HEALTH_CONFIDENCE_HIGH_MAX_ISSUES, 0),
    mediumMaxIssues: parseEnvNumber(env.HEALTH_CONFIDENCE_MEDIUM_MAX_ISSUES, 1),
  },
});

export const DEFAULT_PROJECT_HEALTH_CONFIG = buildDefaultProjectHealthConfig();

export const resolveProjectHealthConfig = (overrides = {}) => {
  const base = buildDefaultProjectHealthConfig();
  if (!overrides || typeof overrides !== 'object') return base;

  return {
    ...base,
    ...overrides,
    weights: { ...base.weights, ...(overrides.weights || {}) },
    statusThresholds: { ...base.statusThresholds, ...(overrides.statusThresholds || {}) },
    taskStatusProgress: { ...base.taskStatusProgress, ...(overrides.taskStatusProgress || {}) },
    terminalStatuses: overrides.terminalStatuses || base.terminalStatuses,
    schedule: { ...base.schedule, ...(overrides.schedule || {}) },
    momentum: { ...base.momentum, ...(overrides.momentum || {}) },
    freshness: {
      ...base.freshness,
      ...(overrides.freshness || {}),
      tiers: overrides.freshness?.tiers || base.freshness.tiers,
    },
    timesheetValidStatuses: overrides.timesheetValidStatuses || base.timesheetValidStatuses,
    confidenceThresholds: {
      ...base.confidenceThresholds,
      ...(overrides.confidenceThresholds || {}),
    },
  };
};
