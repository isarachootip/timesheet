import { useEffect, useState } from 'react';
import {
  useCostRates,
  usePermissionSchemes,
  useProjects,
  useProjectWorkflows,
  useReleases,
  useSprints,
  useSystemSettings,
  useTaskTemplates,
  useTasks,
  useTimesheets,
  useUsers,
} from './useAppQueries';
import { useProjectsHealthSummary } from './useProjectHealth';
import { resolveBootstrapQueryFlags } from '../utils/bootstrapQueryFlags';
import type { User } from '../types';

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('nt_current_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export function useWorkspaceBootstrap() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const { enableUsersQuery, enableWorkspaceQueries } = resolveBootstrapQueryFlags(
    currentUser,
    typeof window !== 'undefined' ? window.location.hostname : ''
  );

  const { data: users = [], isLoading: l1 } = useUsers({ enabled: enableUsersQuery });
  const { data: projects = [], isLoading: l2 } = useProjects({ enabled: enableWorkspaceQueries });
  const { data: tasks = [], isLoading: l3 } = useTasks({ enabled: enableWorkspaceQueries });
  const { data: timesheets = [], isLoading: l4 } = useTimesheets({ enabled: enableWorkspaceQueries });
  const { data: taskTemplates = [] } = useTaskTemplates({ enabled: enableWorkspaceQueries });
  const { data: sprints = [] } = useSprints({ enabled: enableWorkspaceQueries });
  const { data: releases = [] } = useReleases({ enabled: enableWorkspaceQueries });
  const { data: permissionSchemes = [] } = usePermissionSchemes({ enabled: enableWorkspaceQueries });
  const { data: projectWorkflows = [] } = useProjectWorkflows({ enabled: enableWorkspaceQueries });
  const { data: costRates = [] } = useCostRates({ enabled: enableWorkspaceQueries });
  const { data: systemSettings = {} } = useSystemSettings({ enabled: enableWorkspaceQueries });
  const { data: projectHealthSummaries = [] } = useProjectsHealthSummary(currentUser?.id);

  useEffect(() => {
    localStorage.removeItem('nt_technicians_data');
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (!userParam) return;
    try {
      const userObj = JSON.parse(decodeURIComponent(userParam)) as User;
      setCurrentUser(userObj);
      if (window.location.pathname === '/login-success') {
        window.location.href = '/';
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore malformed login redirect payload
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('nt_current_user');
      return;
    }
    localStorage.setItem('nt_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}/chat-notifications`);
        if (res.ok && active) {
          const data: Array<{ isRead: boolean }> = await res.json();
          setUnreadChatCount(data.filter((n) => !n.isRead).length);
        }
      } catch {
        // Ignore poll failure
      }
    };
    poll();
    const id = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [currentUser?.id]);

  return {
    currentUser,
    setCurrentUser,
    unreadChatCount,
    loading: enableWorkspaceQueries && (l1 || l2 || l3 || l4),
    users,
    projects,
    tasks,
    timesheets,
    taskTemplates,
    sprints,
    releases,
    permissionSchemes,
    projectWorkflows,
    costRates,
    systemSettings,
    projectHealthSummaries,
  };
}
