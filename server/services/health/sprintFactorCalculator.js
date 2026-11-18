import { clamp, diffCalendarDays, round2, toUtcDayMs } from './dateUtils.js';
import { getSingleTaskProgressRatio, isTaskDoneStatus } from './taskRollupUtils.js';

const getActiveSprints = (sprints = []) =>
  sprints.filter((s) => String(s?.status || '').trim().toLowerCase() === 'active');

const normalizeDateLabel = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  return str ? str.slice(0, 10) : null;
};

export const calculateSprintFactor = ({
  sprints = [],
  rawTasks = [],
  columns = ['To Do', 'In Progress', 'Review', 'Done'],
  config,
  todayUtcMs,
}) => {
  const activeSprints = getActiveSprints(sprints);
  if (activeSprints.length === 0) {
    return { score: null, details: {}, issues: [] };
  }

  const activeIds = new Set(activeSprints.map((s) => String(s.id)));
  const sprintTasks = rawTasks.filter((t) => activeIds.has(String(t.sprint_id ?? t.sprintId ?? '')));

  if (sprintTasks.length === 0) {
    return {
      score: null,
      details: { sprintName: String(activeSprints[0].name || 'Active Sprint'), totalTasks: 0 },
      issues: [],
    };
  }

  let totalHours = 0;
  let earnedHours = 0;
  let progressSum = 0;
  let doneTasks = 0;

  for (const t of sprintTasks) {
    const status = String(t.status || '');
    const isDone = isTaskDoneStatus(status, columns, config.terminalStatuses);
    if (isDone) doneTasks += 1;
    const ratio = getSingleTaskProgressRatio(status, columns, config);
    const hrs = Math.max(0, Number(t.estimated_hours ?? t.estimatedHours ?? 0) || 0);
    totalHours += hrs;
    earnedHours += hrs * ratio;
    progressSum += ratio;
  }

  const actualRatio = clamp(
    totalHours > 0 ? earnedHours / totalHours : progressSum / sprintTasks.length,
    0,
    1
  );
  const remainingTasks = sprintTasks.length - doneTasks;

  const startCandidates = activeSprints
    .map((s) => toUtcDayMs(s.start_date ?? s.startDate))
    .filter((ms) => ms !== null);
  const endCandidates = activeSprints
    .map((s) => toUtcDayMs(s.end_date ?? s.endDate))
    .filter((ms) => ms !== null);

  const startUtc = startCandidates.length > 0 ? Math.min(...startCandidates) : null;
  const endUtc = endCandidates.length > 0 ? Math.max(...endCandidates) : null;
  const daysRemaining = endUtc !== null ? diffCalendarDays(endUtc, todayUtcMs) : null;

  let score;
  if (remainingTasks === 0) {
    score = 100;
  } else if (startUtc !== null && endUtc !== null && startUtc <= endUtc) {
    const totalDays = diffCalendarDays(endUtc, startUtc);
    const elapsedDays = diffCalendarDays(todayUtcMs, startUtc);
    const plannedRatio =
      totalDays === 0 ? (todayUtcMs < startUtc ? 0 : 1) : clamp(elapsedDays / totalDays, 0, 1);
    score = plannedRatio === 0 ? 100 : Math.min(100, (actualRatio / plannedRatio) * 100);
    if (daysRemaining !== null && daysRemaining < 0) {
      const overdueDays = Math.abs(daysRemaining);
      score = Math.max(0, score - (25 + overdueDays * 5));
    }
  } else {
    score = actualRatio * 100;
  }

  return {
    score: round2(clamp(score, 0, 100)),
    details: {
      sprintName: activeSprints.map((s) => String(s.name || s.id)).join(', '),
      totalTasks: sprintTasks.length,
      doneTasks,
      remainingTasks,
      daysRemaining,
      progressPercent: round2(actualRatio * 100),
    },
    issues: [],
  };
};

export const buildActiveSprintAiContext = ({
  sprints = [],
  rawTasks = [],
  columns = ['To Do', 'In Progress', 'Review', 'Done'],
  config,
  todayUtcMs,
}) => {
  const activeSprints = getActiveSprints(sprints);
  return activeSprints.map((sp) => {
    const spId = String(sp.id);
    const spTasks = rawTasks.filter((t) => String(t.sprint_id ?? t.sprintId ?? '') === spId);
    const openTasks = spTasks.filter(
      (t) => !isTaskDoneStatus(String(t.status || ''), columns, config.terminalStatuses)
    );
    const endUtc = toUtcDayMs(sp.end_date ?? sp.endDate);
    return {
      id: spId,
      name: String(sp.name || spId),
      startDate: normalizeDateLabel(sp.start_date ?? sp.startDate),
      endDate: normalizeDateLabel(sp.end_date ?? sp.endDate),
      daysRemaining: endUtc !== null ? diffCalendarDays(endUtc, todayUtcMs) : null,
      totalTasks: spTasks.length,
      doneTasks: spTasks.length - openTasks.length,
      openTaskTitles: openTasks.slice(0, 10).map((t) => String(t.title || t.id)),
    };
  });
};
