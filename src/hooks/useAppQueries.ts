import { useQuery } from '@tanstack/react-query';
import type { User, Project, Task, TimesheetEntry, TaskTemplate, Sprint, Release, PermissionScheme, ProjectWorkflow, CostRate } from '../types';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useTimesheets() {
  return useQuery<TimesheetEntry[]>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const res = await fetch('/api/timesheets');
      if (!res.ok) throw new Error('Failed to fetch timesheets');
      return res.json();
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useTaskTemplates() {
  return useQuery<TaskTemplate[]>({
    queryKey: ['taskTemplates'],
    queryFn: async () => {
      const res = await fetch('/api/task-templates');
      if (!res.ok) throw new Error('Failed to fetch task templates');
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useSprints() {
  return useQuery<Sprint[]>({
    queryKey: ['sprints'],
    queryFn: async () => {
      const res = await fetch('/api/sprints');
      if (!res.ok) throw new Error('Failed to fetch sprints');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useReleases() {
  return useQuery<Release[]>({
    queryKey: ['releases'],
    queryFn: async () => {
      const res = await fetch('/api/releases');
      if (!res.ok) throw new Error('Failed to fetch releases');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePermissionSchemes() {
  return useQuery<PermissionScheme[]>({
    queryKey: ['permissionSchemes'],
    queryFn: async () => {
      const res = await fetch('/api/permission-schemes');
      if (!res.ok) throw new Error('Failed to fetch permission schemes');
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useProjectWorkflows() {
  return useQuery<ProjectWorkflow[]>({
    queryKey: ['projectWorkflows'],
    queryFn: async () => {
      const res = await fetch('/api/project-workflows');
      if (!res.ok) throw new Error('Failed to fetch project workflows');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCostRates() {
  return useQuery<CostRate[]>({
    queryKey: ['costRates'],
    queryFn: async () => {
      const res = await fetch('/api/cost-rates');
      if (!res.ok) throw new Error('Failed to fetch cost rates');
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useSystemSettings() {
  return useQuery<Record<string, any>>({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const res = await fetch('/api/system-settings');
      if (!res.ok) throw new Error('Failed to fetch system settings');
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}
