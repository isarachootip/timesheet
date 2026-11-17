import { DEFAULT_PROJECT_HEALTH_CONFIG } from '../../config/projectHealthConfig.js';
import { isTaskDoneStatus, resolveWorkflowColumns } from './taskRollupUtils.js';

export const resolveTaskCompletedAt = ({
  oldTask = null,
  nextStatus,
  project = null,
  workflow = null,
  nowIso = new Date().toISOString(),
}) => {
  const columns = resolveWorkflowColumns(project, workflow);
  const terminal = DEFAULT_PROJECT_HEALTH_CONFIG.terminalStatuses;
  const nextIsDone = isTaskDoneStatus(nextStatus, columns, terminal);

  if (!nextIsDone) {
    return null;
  }

  if (oldTask) {
    const prevCompleted = oldTask.completed_at ?? oldTask.completedAt ?? null;
    const prevIsDone = isTaskDoneStatus(oldTask.status, columns, terminal);
    if (prevIsDone && prevCompleted) {
      return String(prevCompleted);
    }
  }

  return nowIso;
};
