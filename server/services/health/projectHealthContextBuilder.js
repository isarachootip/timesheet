import { resolveProjectHealthConfig } from '../../config/projectHealthConfig.js';
import { diffCalendarDays, round2, toUtcDayMs } from './dateUtils.js';
import { parseProjectMembers } from './projectHealthPermissions.js';
import { buildTaskRollup, resolveWorkflowColumns } from './taskRollupUtils.js';
import { buildActiveSprintAiContext } from './sprintFactorCalculator.js';
import { getHealthHistorySnapshots } from '../../repositories/projectHealthRepository.js';

const PRIORITY_RANK = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

const findRootMilestoneId = (taskId, taskMap) => {
  let current = taskMap.get(taskId);
  const visited = new Set();
  while (current && current.parent_id && taskMap.has(current.parent_id)) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    current = taskMap.get(current.parent_id);
  }
  return current ? String(current.id) : null;
};

export const buildProjectHealthAiContext = async (projectId, liveHealth, options = {}) => {
  const db = options.db || (await import('../../config/db.js')).pool;
  const config = resolveProjectHealthConfig(options.config || {});
  const nowDate =
    options.referenceDate instanceof Date
      ? options.referenceDate
      : options.referenceDate
        ? new Date(options.referenceDate)
        : new Date();
  const todayUtcMs = toUtcDayMs(nowDate) ?? Date.now();

  const [projectRes, workflowRes, tasksRes, timesheetsRes, sprintsRes, usersRes, recentSnapshots] =
    await Promise.all([
      db.query('SELECT * FROM projects WHERE id = $1', [projectId]),
      db.query('SELECT * FROM project_workflows WHERE project_id = $1', [projectId]),
      db.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]),
      db.query('SELECT * FROM timesheets WHERE project_id = $1 AND COALESCE(is_personal, FALSE) = FALSE', [projectId]),
      db.query('SELECT * FROM sprints WHERE project_id = $1', [projectId]),
      db.query('SELECT id, name FROM users'),
      getHealthHistorySnapshots(db, projectId, 4),
    ]);

  const project = projectRes.rows[0];
  if (!project) {
    const err = new Error(`Project "${projectId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  const workflow = workflowRes.rows[0] || null;
  const rawTasks = tasksRes.rows;
  const rawTimesheets = timesheetsRes.rows;
  const userMap = new Map(usersRes.rows.map((u) => [String(u.id), String(u.name)]));
  const rawTaskMap = new Map(rawTasks.map((t) => [String(t.id), t]));

  const rollup = buildTaskRollup(project, workflow, rawTasks, config);
  const columns = resolveWorkflowColumns(project, workflow);
  const activeSprints = buildActiveSprintAiContext({
    sprints: sprintsRes.rows,
    rawTasks,
    columns,
    config,
    todayUtcMs,
  });
  const projectType = String(project.project_type || 'dev').toLowerCase();

  const overdueTasks = rollup.leafTasks
    .filter((t) => !t.isDone && t.endDateUtc !== null && t.endDateUtc < todayUtcMs)
    .map((t) => {
      const raw = rawTaskMap.get(t.id) || {};
      const assigneeId = raw.assignee_id ?? raw.assigneeId ?? null;
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: String(raw.priority || 'Medium'),
        dueDate: String(raw.end_date ?? raw.endDate ?? ''),
        daysOverdue: diffCalendarDays(todayUtcMs, t.endDateUtc),
        estimatedHours: round2(t.effectiveHours),
        assigneeName: assigneeId ? userMap.get(String(assigneeId)) || 'Unknown' : 'Unassigned',
      };
    })
    .sort(
      (a, b) =>
        b.daysOverdue - a.daysOverdue ||
        (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0)
    )
    .slice(0, 10);

  const inProgressTasks = rollup.leafTasks
    .filter((t) => !t.isDone && t.progressRatio > 0)
    .map((t) => {
      const raw = rawTaskMap.get(t.id) || {};
      const assigneeId = raw.assignee_id ?? raw.assigneeId ?? null;
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: String(raw.priority || 'Medium'),
        dueDate: raw.end_date ?? raw.endDate ?? null,
        estimatedHours: round2(t.effectiveHours),
        assigneeName: assigneeId ? userMap.get(String(assigneeId)) || 'Unknown' : 'Unassigned',
      };
    })
    .sort((a, b) => (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0))
    .slice(0, 25);

  const validTsStatuses = new Set(config.timesheetValidStatuses.map((s) => String(s).toLowerCase()));
  const actualByMilestone = new Map();
  let unassignedActualHours = 0;

  for (const ts of rawTimesheets) {
    if (!validTsStatuses.has(String(ts.status || '').toLowerCase())) continue;
    const hrs = Math.max(0, Number(ts.hours) || 0);
    if (hrs <= 0) continue;

    const taskId = ts.task_id ?? ts.taskId ?? null;
    const targetMilestoneId =
      taskId && projectType === 'support'
        ? String(taskId)
        : taskId
          ? findRootMilestoneId(String(taskId), rawTaskMap)
          : null;

    if (targetMilestoneId && rollup.milestones.some((m) => m.id === targetMilestoneId)) {
      actualByMilestone.set(targetMilestoneId, (actualByMilestone.get(targetMilestoneId) || 0) + hrs);
    } else {
      unassignedActualHours += hrs;
    }
  }

  const milestoneHoursComparison = rollup.milestones.map((m) => {
    const est = round2(m.effectiveHours);
    const act = round2(actualByMilestone.get(m.id) || 0);
    return {
      milestoneId: m.id,
      title: m.title,
      status: m.status,
      progressPercent: round2(m.progressRatio * 100),
      estimatedHours: est,
      actualHours: act,
      varianceHours: round2(act - est),
    };
  });

  if (unassignedActualHours > 0) {
    milestoneHoursComparison.push({
      milestoneId: 'unassigned',
      title: 'Project-level / Unassigned Task Hours',
      status: 'N/A',
      progressPercent: 0,
      estimatedHours: 0,
      actualHours: round2(unassignedActualHours),
      varianceHours: round2(unassignedActualHours),
    });
  }

  return {
    project: {
      id: String(project.id),
      name: String(project.name),
      description: String(project.description || ''),
      status: String(project.status),
      projectType,
      startDate: project.start_date ?? null,
      endDate: project.end_date ?? null,
      budget: project.budget !== null && project.budget !== undefined ? Number(project.budget) : null,
      memberCount: parseProjectMembers(project.members).length,
      overallProgress: liveHealth.overallProgress,
    },
    health: {
      healthScore: liveHealth.healthScore,
      status: liveHealth.status,
      confidence: liveHealth.confidence,
      factors: liveHealth.factors,
      factorDetails: liveHealth.factorDetails,
    },
    dataIssues: liveHealth.dataIssues,
    activeSprints,
    overdueTasks,
    inProgressTasks,
    milestoneHoursComparison,
    recentSnapshots: recentSnapshots.map((s) => ({
      snapshotDate: s.snapshotDate,
      calculatedAt: s.calculatedAt,
      healthScore: s.healthScore,
      status: s.status,
      confidence: s.confidence,
      factors: s.factors,
    })),
  };
};
