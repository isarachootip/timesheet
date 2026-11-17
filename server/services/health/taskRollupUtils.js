import { toUtcDayMs } from './dateUtils.js';

const parseJsonArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const resolveWorkflowColumns = (project, workflow) => {
  const wfStatuses = parseJsonArray(workflow?.statuses);
  if (wfStatuses.length > 0) return wfStatuses.map(String);
  const projCols = parseJsonArray(project?.custom_columns ?? project?.customColumns);
  if (projCols.length > 0) return projCols.map(String);
  return ['To Do', 'In Progress', 'Review', 'Done'];
};

export const isTaskDoneStatus = (status, columns, terminalStatuses) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return false;
  if (terminalStatuses.includes(normalized)) return true;
  if (columns.length > 0) {
    const finalCol = String(columns[columns.length - 1]).trim().toLowerCase();
    return normalized === finalCol;
  }
  return false;
};

export const getSingleTaskProgressRatio = (status, columns, config) => {
  if (isTaskDoneStatus(status, columns, config.terminalStatuses)) {
    return config.taskStatusProgress.done;
  }
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'review') return config.taskStatusProgress.review;
  const firstCol = columns.length >= 2 ? String(columns[0]).trim().toLowerCase() : 'to do';
  if (!normalized || normalized === 'to do' || normalized === 'todo' || normalized === 'backlog' || normalized === firstCol) {
    return config.taskStatusProgress.todo;
  }
  return config.taskStatusProgress.inProgress;
};

const normalizeTaskRecord = (raw, columns, config) => {
  const status = String(raw.status || '');
  const isDone = isTaskDoneStatus(status, columns, config.terminalStatuses);
  const rawHours = Math.max(0, Number(raw.estimated_hours ?? raw.estimatedHours ?? 0) || 0);
  const progressRatio = getSingleTaskProgressRatio(status, columns, config);
  const completedRaw = raw.completed_at ?? raw.completedAt ?? (isDone ? (raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? raw.createdAt) : null);

  return {
    id: String(raw.id),
    parentId: raw.parent_id ?? raw.parentId ?? null,
    title: String(raw.title || ''),
    status,
    isDone,
    rawHours,
    effectiveHours: rawHours,
    progressRatio,
    endDateUtc: toUtcDayMs(raw.end_date ?? raw.endDate),
    completedDateUtc: toUtcDayMs(completedRaw),
    updatedDateUtc: toUtcDayMs(raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? raw.createdAt),
  };
};

const collectLeafDescendants = (rootId, childrenByParent, visited = new Set()) => {
  const children = childrenByParent.get(rootId) || [];
  if (children.length === 0) return [];
  const leaves = [];
  for (const child of children) {
    if (visited.has(child.id)) continue;
    visited.add(child.id);
    const grandLeaves = collectLeafDescendants(child.id, childrenByParent, visited);
    if (grandLeaves.length > 0) leaves.push(...grandLeaves);
    else leaves.push(child);
  }
  return leaves;
};

export const buildTaskRollup = (project, workflow, rawTasks = [], config) => {
  const columns = resolveWorkflowColumns(project, workflow);
  const projectType = String(project?.project_type ?? project?.projectType ?? 'dev').toLowerCase();
  const normalized = rawTasks.map((t) => normalizeTaskRecord(t, columns, config));

  if (projectType === 'support') {
    const tickets = normalized.filter((t) => Boolean(t.parentId));
    const totalEstimatedHours = tickets.reduce((sum, t) => sum + t.effectiveHours, 0);
    const overallProgressRatio =
      tickets.length === 0
        ? 0
        : totalEstimatedHours > 0
          ? tickets.reduce((sum, t) => sum + t.effectiveHours * t.progressRatio, 0) / totalEstimatedHours
          : tickets.reduce((sum, t) => sum + t.progressRatio, 0) / tickets.length;
    return {
      milestones: tickets,
      leafTasks: tickets,
      totalEstimatedHours,
      overallProgressRatio,
      allTasksDone: tickets.length > 0 && tickets.every((t) => t.isDone),
    };
  }

  const taskMap = new Map(normalized.map((t) => [t.id, t]));
  const childrenByParent = new Map();
  for (const t of normalized) {
    if (t.parentId && taskMap.has(t.parentId)) {
      const list = childrenByParent.get(t.parentId) || [];
      list.push(t);
      childrenByParent.set(t.parentId, list);
    }
  }

  const roots = normalized.filter((t) => !t.parentId || !taskMap.has(t.parentId));
  const milestones = [];
  const leafTasks = [];

  for (const root of roots) {
    const leaves = collectLeafDescendants(root.id, childrenByParent, new Set([root.id]));
    if (leaves.length === 0) {
      milestones.push({ ...root });
      leafTasks.push({ ...root });
      continue;
    }

    const subHoursSum = leaves.reduce((sum, l) => sum + l.rawHours, 0);
    if (subHoursSum > 0) {
      const progressRatio = leaves.reduce((sum, l) => sum + l.rawHours * l.progressRatio, 0) / subHoursSum;
      milestones.push({ ...root, effectiveHours: subHoursSum, progressRatio });
      leafTasks.push(...leaves.map((l) => ({ ...l, effectiveHours: l.rawHours })));
    } else {
      const progressRatio = leaves.reduce((sum, l) => sum + l.progressRatio, 0) / leaves.length;
      const distributedHours = root.rawHours > 0 ? root.rawHours / leaves.length : 0;
      milestones.push({ ...root, effectiveHours: root.rawHours, progressRatio });
      leafTasks.push(...leaves.map((l) => ({ ...l, effectiveHours: distributedHours })));
    }
  }

  const totalEstimatedHours = milestones.reduce((sum, m) => sum + m.effectiveHours, 0);
  const overallProgressRatio =
    milestones.length === 0
      ? 0
      : totalEstimatedHours > 0
        ? milestones.reduce((sum, m) => sum + m.effectiveHours * m.progressRatio, 0) / totalEstimatedHours
        : milestones.reduce((sum, m) => sum + m.progressRatio, 0) / milestones.length;

  return {
    milestones,
    leafTasks,
    totalEstimatedHours,
    overallProgressRatio,
    allTasksDone: leafTasks.length > 0 && leafTasks.every((t) => t.isDone),
  };
};
