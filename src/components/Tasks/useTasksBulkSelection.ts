import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PermissionScheme, Project, ProjectWorkflow, Task, User } from '../../types';
import { getProjectFinalStatus, isTaskDone, isTaskOverdue } from '../../utils/overdueUtils';
import { hasProjectPermission } from '../../utils/projectPermissions';
import { bulkUpdateTasks, type BulkTasksPatch } from '../../services/bulkUpdateApi';
import { toast } from '../ui/ToastProvider';

export type BulkScopeFilter = 'overdue' | 'incomplete' | 'all';

interface UseTasksBulkSelectionParams {
  tasks: Task[];
  projects: Project[];
  users: User[];
  projectWorkflows: ProjectWorkflow[];
  permissionSchemes: PermissionScheme[];
  selectedProjectId: string;
  currentUser: User | null;
}

export const useTasksBulkSelection = ({
  tasks,
  projects,
  users,
  projectWorkflows,
  permissionSchemes,
  selectedProjectId,
  currentUser,
}: UseTasksBulkSelectionParams) => {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<BulkScopeFilter>('overdue');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const workflowMap = useMemo(() => new Map(projectWorkflows.map((w) => [w.projectId, w])), [projectWorkflows]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const canBulkModify = (task: Task): boolean => {
    if (!currentUser) return false;
    if (currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') return true;
    const proj = projectMap.get(task.projectId);
    const member = proj?.members?.find((m) => m.userId === currentUser.id);
    if (member && (member.role === 'PM' || member.role === 'Team Lead' || member.role === 'Leader')) {
      return true;
    }
    return hasProjectPermission(currentUser, projects, permissionSchemes, task.projectId, 'edit_task', task);
  };

  const projectScopedTasks = useMemo(
    () =>
      tasks.filter((t) =>
        selectedProjectId === 'all' ? projectMap.has(t.projectId) : t.projectId === selectedProjectId
      ),
    [tasks, selectedProjectId, projectMap]
  );

  const overdueTotal = useMemo(
    () =>
      projectScopedTasks.filter((t) =>
        isTaskOverdue(t, today, { project: projectMap.get(t.projectId), workflow: workflowMap.get(t.projectId) })
      ).length,
    [projectScopedTasks, today, projectMap, workflowMap]
  );

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectScopedTasks.filter((t) => {
      const proj = projectMap.get(t.projectId);
      const wf = workflowMap.get(t.projectId);
      if (scope === 'overdue' && !isTaskOverdue(t, today, { project: proj, workflow: wf })) return false;
      if (scope === 'incomplete' && isTaskDone(t, proj, wf)) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || (proj?.name.toLowerCase().includes(q) ?? false);
    });
  }, [projectScopedTasks, scope, search, today, projectMap, workflowMap]);

  const editableVisibleIds = visibleTasks.filter(canBulkModify).map((t) => t.id);
  const activeSelected = selectedIds.filter((id) => editableVisibleIds.includes(id));
  const allSelected = editableVisibleIds.length > 0 && activeSelected.length === editableVisibleIds.length;

  const activeProj = selectedProjectId === 'all' ? undefined : projectMap.get(selectedProjectId);
  const activeWf = selectedProjectId === 'all' ? undefined : workflowMap.get(selectedProjectId);
  const defaultDoneStatus = getProjectFinalStatus(activeProj, activeWf);
  const availableStatuses = activeWf?.statuses?.length
    ? activeWf.statuses
    : activeProj?.customColumns?.length
      ? activeProj.customColumns
      : ['To Do', 'In Progress', 'Review', 'Done'];

  const runBulkPatch = async (patch: BulkTasksPatch) => {
    if (!currentUser || activeSelected.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await bulkUpdateTasks(currentUser.id, activeSelected, patch);
      const updatedSet = new Set(res.updatedIds);
      queryClient.setQueryData<Task[]>(['tasks'], (prev = []) =>
        prev.map((t) => {
          if (!updatedSet.has(t.id)) return t;
          return {
            ...t,
            status: patch.status !== undefined ? patch.status : t.status,
            endDate: patch.endDate !== undefined ? patch.endDate || undefined : t.endDate,
          };
        })
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const skipMsg = res.skipped.length > 0 ? ` (${res.skipped.length} skipped)` : '';
      toast.success(`Updated ${res.updatedIds.length} task(s)${skipMsg}.`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk task update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    today,
    scope,
    setScope,
    search,
    setSearch,
    selectedIds,
    setSelectedIds,
    isSubmitting,
    projectMap,
    workflowMap,
    userMap,
    overdueTotal,
    visibleTasks,
    editableVisibleIds,
    activeSelected,
    allSelected,
    defaultDoneStatus,
    availableStatuses,
    canBulkModify,
    runBulkPatch,
  };
};
