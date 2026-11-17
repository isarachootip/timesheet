import { useCallback } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, User } from '../../types';
import {
  buildProjectTimesheetLogUrl,
  isInteractiveDescendant,
  validateProjectTimesheetNavigation,
} from '../../utils/projectTimesheetNavigation';
import { toast } from '../ui/ToastProvider';

export function useProjectTimesheetNavigate(currentUser: User | null) {
  const navigate = useNavigate();

  const triggerNavigation = useCallback(
    (project: Project, openInNewTab: boolean) => {
      const check = validateProjectTimesheetNavigation(project, currentUser);
      if (!check.allowed) {
        toast.error(check.message);
        return;
      }
      const url = buildProjectTimesheetLogUrl(project.id);
      if (openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      navigate(url, { state: { autoOpenLog: true, projectId: project.id } });
    },
    [currentUser, navigate]
  );

  const handleSurfaceClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, project: Project) => {
      if (isInteractiveDescendant(e.target, e.currentTarget)) return;
      const openInNewTab = e.ctrlKey || e.metaKey;
      if (openInNewTab) e.preventDefault();
      triggerNavigation(project, openInNewTab);
    },
    [triggerNavigation]
  );

  const handleSurfaceAuxClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, project: Project) => {
      if (e.button !== 1) return;
      if (isInteractiveDescendant(e.target, e.currentTarget)) return;
      e.preventDefault();
      triggerNavigation(project, true);
    },
    [triggerNavigation]
  );

  const handleSurfaceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, project: Project) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (isInteractiveDescendant(e.target, e.currentTarget)) return;
      e.preventDefault();
      triggerNavigation(project, e.ctrlKey || e.metaKey);
    },
    [triggerNavigation]
  );

  return { handleSurfaceClick, handleSurfaceAuxClick, handleSurfaceKeyDown };
}
