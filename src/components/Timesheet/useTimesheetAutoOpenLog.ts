import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Project, User } from '../../types';
import {
  parseTimesheetAutoOpenIntent,
  type TimesheetAutoOpenIntent,
} from '../../schemas/timesheetNavigationSchema';
import {
  getLoggableProjects,
  validateProjectTimesheetNavigation,
} from '../../utils/projectTimesheetNavigation';
import { toast } from '../ui/ToastProvider';

interface UseTimesheetAutoOpenLogParams {
  projects: Project[];
  currentUser: User;
  onOpenWithIntent: (intent: TimesheetAutoOpenIntent, resolvedProjectId: string) => void;
}

export function useTimesheetAutoOpenLog({
  projects,
  currentUser,
  onOpenWithIntent,
}: UseTimesheetAutoOpenLogParams): void {
  const location = useLocation();
  const navigate = useNavigate();
  const handledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const intent = parseTimesheetAutoOpenIntent(location.search, location.state);
    if (!intent) return;

    const currentSignature = `${location.key}|${location.search}|${intent.source}`;
    if (handledKeyRef.current === currentSignature) return;
    handledKeyRef.current = currentSignature;

    if (intent.projectId) {
      const targetProject = projects.find((p) => p.id === intent.projectId);
      const validation = validateProjectTimesheetNavigation(targetProject, currentUser);
      if (!validation.allowed) {
        const message = validation.message;
        queueMicrotask(() => toast.error(message));
        navigate('/timesheet', { replace: true, state: null });
        return;
      }
      onOpenWithIntent(intent, validation.project.id);
      navigate('/timesheet', { replace: true, state: null });
      return;
    }

    const fallbackId = getLoggableProjects(projects, currentUser)[0]?.id || '';
    onOpenWithIntent(intent, fallbackId);
    navigate('/timesheet', { replace: true, state: null });
  }, [location.key, location.search, location.state, projects, currentUser, navigate, onOpenWithIntent]);
}
