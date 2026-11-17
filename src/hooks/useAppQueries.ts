import { useQuery } from '@tanstack/react-query';
import type {
  CostRate,
  PermissionScheme,
  Project,
  ProjectWorkflow,
  Release,
  Sprint,
  Task,
  TaskTemplate,
  TimesheetEntry,
  User,
} from '../types';

export interface QueryHookOptions {
  enabled?: boolean;
}

export function useUsers(options: QueryHookOptions = {}) {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjects(options: QueryHookOptions = {}) {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTasks(options: QueryHookOptions = {}) {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 1 * 60 * 1000,
  });
}

export function useTimesheets(options: QueryHookOptions = {}) {
  return useQuery<TimesheetEntry[]>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const res = await fetch('/api/timesheets');
      if (!res.ok) throw new Error('Failed to fetch timesheets');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 1 * 60 * 1000,
  });
}

export function useTaskTemplates(options: QueryHookOptions = {}) {
  return useQuery<TaskTemplate[]>({
    queryKey: ['taskTemplates'],
    queryFn: async () => {
      const res = await fetch('/api/task-templates');
      if (!res.ok) throw new Error('Failed to fetch task templates');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSprints(options: QueryHookOptions = {}) {
  return useQuery<Sprint[]>({
    queryKey: ['sprints'],
    queryFn: async () => {
      const res = await fetch('/api/sprints');
      if (!res.ok) throw new Error('Failed to fetch sprints');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReleases(options: QueryHookOptions = {}) {
  return useQuery<Release[]>({
    queryKey: ['releases'],
    queryFn: async () => {
      const res = await fetch('/api/releases');
      if (!res.ok) throw new Error('Failed to fetch releases');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePermissionSchemes(options: QueryHookOptions = {}) {
  return useQuery<PermissionScheme[]>({
    queryKey: ['permissionSchemes'],
    queryFn: async () => {
      const res = await fetch('/api/permission-schemes');
      if (!res.ok) throw new Error('Failed to fetch permission schemes');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 60 * 60 * 1000,
  });
}

export function useProjectWorkflows(options: QueryHookOptions = {}) {
  return useQuery<ProjectWorkflow[]>({
    queryKey: ['projectWorkflows'],
    queryFn: async () => {
      const res = await fetch('/api/project-workflows');
      if (!res.ok) throw new Error('Failed to fetch project workflows');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCostRates(options: QueryHookOptions = {}) {
  return useQuery<CostRate[]>({
    queryKey: ['costRates'],
    queryFn: async () => {
      const res = await fetch('/api/cost-rates');
      if (!res.ok) throw new Error('Failed to fetch cost rates');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSystemSettings(options: QueryHookOptions = {}) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const res = await fetch('/api/system-settings');
      if (!res.ok) throw new Error('Failed to fetch system settings');
      return res.json();
    },
    enabled: options.enabled ?? true,
    staleTime: 60 * 60 * 1000,
  });
}
