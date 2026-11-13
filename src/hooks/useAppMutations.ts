import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  CostRate,
  PermissionScheme,
  Project,
  ProjectWorkflow,
  Sprint,
  Release,
  Task,
  TaskTemplate,
  TimesheetEntry,
  User,
} from '../types';
import { toast } from '../components/ui/ToastProvider';

interface UseAppMutationsParams {
  currentUser: User | null;
  onTaskMovedToInProgress: (task: Task) => void;
}

interface SyncCollectionConfig<T> {
  queryKey: string[];
  getId: (item: T) => string;
  endpoint: (item?: T) => string;
  deleteEndpoint?: (id: string) => string;
  entityLabel: string;
  allowDelete?: boolean;
  onBeforeSave?: (item: T) => T;
  onAfterSave?: (item: T, prevItem?: T) => void;
  onAfterDelete?: () => void;
}

export const useAppMutations = ({
  currentUser,
  onTaskMovedToInProgress,
}: UseAppMutationsParams) => {
  const queryClient = useQueryClient();

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const createSyncSetter = <T,>(config: SyncCollectionConfig<T>): Dispatch<SetStateAction<T[]>> => {
    return (value) => {
      queryClient.setQueryData<T[]>(config.queryKey, (prev = []) => {
        const next = typeof value === 'function' ? (value as (p: T[]) => T[])(prev) : value;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || '',
        };

        const nextIds = new Set(next.map(config.getId));
        const deletedItems = config.allowDelete === false
          ? []
          : prev.filter((item) => !nextIds.has(config.getId(item)));

        for (const deleted of deletedItems) {
          const delUrl = config.deleteEndpoint
            ? config.deleteEndpoint(config.getId(deleted))
            : `${config.endpoint()}/${config.getId(deleted)}`;
          fetch(delUrl, { method: 'DELETE', headers })
            .then(async (res) => {
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { error?: string }).error || `Failed to delete ${config.entityLabel}`);
                queryClient.invalidateQueries({ queryKey: config.queryKey });
              } else {
                config.onAfterDelete?.();
              }
            })
            .catch(() => {
              toast.error(`Network error while deleting ${config.entityLabel}`);
              queryClient.invalidateQueries({ queryKey: config.queryKey });
            });
        }

        for (const item of next) {
          const prevItem = prev.find((p) => config.getId(p) === config.getId(item));
          if (JSON.stringify(prevItem) !== JSON.stringify(item)) {
            const payload = config.onBeforeSave ? config.onBeforeSave(item) : item;
            fetch(config.endpoint(payload), {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            })
              .then(async (res) => {
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  toast.error((err as { error?: string }).error || `Failed to save ${config.entityLabel}`);
                  queryClient.invalidateQueries({ queryKey: config.queryKey });
                } else {
                  config.onAfterSave?.(payload, prevItem);
                }
              })
              .catch(() => {
                toast.error(`Network error while saving ${config.entityLabel}`);
                queryClient.invalidateQueries({ queryKey: config.queryKey });
              });
          }
        }

        return next;
      });
    };
  };

  const handleSetUsers = createSyncSetter<User>({
    queryKey: ['users'],
    getId: (u) => u.id,
    endpoint: () => '/api/users',
    entityLabel: 'user',
  });

  const handleSetProjects = createSyncSetter<Project>({
    queryKey: ['projects'],
    getId: (p) => p.id,
    endpoint: () => '/api/projects',
    entityLabel: 'project',
    onAfterDelete: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleSetTasks = createSyncSetter<Task>({
    queryKey: ['tasks'],
    getId: (t) => t.id,
    endpoint: () => '/api/tasks',
    entityLabel: 'task',
    onBeforeSave: (t) => ({ ...t, updatedAt: new Date().toISOString() }),
    onAfterSave: (nTask, prevTask) => {
      const prevStatus = prevTask?.status?.toLowerCase() || '';
      const newStatus = nTask.status?.toLowerCase() || '';
      if (newStatus === 'in progress' && prevStatus !== 'in progress') {
        onTaskMovedToInProgress(nTask);
      }
    },
  });

  const handleSetTimesheets = createSyncSetter<TimesheetEntry>({
    queryKey: ['timesheets'],
    getId: (ts) => ts.id,
    endpoint: () => '/api/timesheets',
    entityLabel: 'timesheet',
  });

  const handleSetTaskTemplates = createSyncSetter<TaskTemplate>({
    queryKey: ['taskTemplates'],
    getId: (tpl) => tpl.id,
    endpoint: () => '/api/task-templates',
    entityLabel: 'task template',
  });

  const handleSetSprints = createSyncSetter<Sprint>({
    queryKey: ['sprints'],
    getId: (s) => s.id,
    endpoint: () => '/api/sprints',
    entityLabel: 'sprint',
  });

  const handleSetReleases = createSyncSetter<Release>({
    queryKey: ['releases'],
    getId: (r) => r.id,
    endpoint: () => '/api/releases',
    entityLabel: 'release',
  });

  const handleSetPermissionSchemes = createSyncSetter<PermissionScheme>({
    queryKey: ['permissionSchemes'],
    getId: (s) => s.id,
    endpoint: () => '/api/permission-schemes',
    entityLabel: 'permission scheme',
  });

  const handleSetProjectWorkflows = createSyncSetter<ProjectWorkflow>({
    queryKey: ['projectWorkflows'],
    getId: (w) => w.projectId,
    endpoint: (w) => `/api/projects/${w?.projectId || ''}/workflow`,
    entityLabel: 'project workflow',
    allowDelete: false,
  });

  const handleSetCostRates = createSyncSetter<CostRate>({
    queryKey: ['costRates'],
    getId: (c) => c.id,
    endpoint: () => '/api/cost-rates',
    entityLabel: 'cost rate',
  });

  const setSystemSettings: Dispatch<SetStateAction<Record<string, unknown>>> = (val) =>
    queryClient.setQueryData<Record<string, unknown>>(['systemSettings'], (prev = {}) =>
      typeof val === 'function' ? val(prev) : val
    );

  return {
    refreshAll,
    handleSetUsers,
    handleSetProjects,
    handleSetTasks,
    handleSetTimesheets,
    handleSetTaskTemplates,
    handleSetSprints,
    handleSetReleases,
    handleSetPermissionSchemes,
    handleSetProjectWorkflows,
    handleSetCostRates,
    setSystemSettings,
  };
};
