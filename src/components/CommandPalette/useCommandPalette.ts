import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PermissionScheme, PersonalNote, Project, Task, User } from '../../types';
import { NAV_ROUTES } from '../../utils/routeMeta';
import { hasProjectPermission } from '../../utils/projectPermissions';

export type PaletteCategory = 'Action' | 'Page' | 'Project' | 'Task' | 'Note';

export interface PaletteItem {
  id: string;
  category: PaletteCategory;
  title: string;
  subtitle?: string;
  shortcut?: string;
  onSelect: () => void;
}

interface UseCommandPaletteParams {
  isOpen: boolean;
  onClose: () => void;
  onOpenPalette: () => void;
  onOpenQuickCreate: () => void;
  onToggleTheme: () => void;
  projects: Project[];
  tasks: Task[];
  notes: PersonalNote[];
  permissionSchemes: PermissionScheme[];
  currentUser: User | null;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
};

export const useCommandPalette = ({
  isOpen,
  onClose,
  onOpenPalette,
  onOpenQuickCreate,
  onToggleTheme,
  projects,
  tasks,
  notes,
  permissionSchemes,
  currentUser,
}: UseCommandPaletteParams) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const creatableProjects = useMemo(
    () =>
      projects.filter((proj) =>
        hasProjectPermission(currentUser, projects, permissionSchemes, proj.id, 'create_task')
      ),
    [projects, permissionSchemes, currentUser]
  );

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: PaletteItem[] = [];

    if (creatableProjects.length > 0) {
      list.push({
        id: 'action-create-task',
        category: 'Action',
        title: 'Create New Task',
        subtitle: `Available in ${creatableProjects.length} project(s)`,
        shortcut: 'C',
        onSelect: () => {
          onClose();
          onOpenQuickCreate();
        },
      });
    }

    list.push({
      id: 'action-log-time',
      category: 'Action',
      title: 'Log Timesheet',
      subtitle: 'Open daily time logging modal',
      shortcut: 'L',
      onSelect: () => {
        onClose();
        navigate('/timesheet', { state: { autoOpenLog: true } });
      },
    });

    list.push({
      id: 'action-toggle-theme',
      category: 'Action',
      title: 'Toggle Light / Dark Theme',
      subtitle: 'Switch between Light and Charcoal Dark mode',
      onSelect: () => {
        onClose();
        onToggleTheme();
      },
    });

    for (const route of NAV_ROUTES) {
      list.push({
        id: `page-${route.path}`,
        category: 'Page',
        title: route.title,
        subtitle: route.subtitle,
        shortcut: route.shortcut,
        onSelect: () => {
          onClose();
          navigate(route.path);
        },
      });
    }

    for (const proj of projects) {
      list.push({
        id: `proj-${proj.id}`,
        category: 'Project',
        title: proj.name,
        subtitle: `Status: ${proj.status}`,
        onSelect: () => {
          onClose();
          navigate(`/projects#${proj.id}`);
        },
      });
    }

    const taskPool = q
      ? tasks.filter((t) => t.title.toLowerCase().includes(q))
      : tasks.filter((t) => t.assigneeId === currentUser?.id && t.status !== 'Done').slice(0, 6);

    for (const task of taskPool.slice(0, 10)) {
      const projName = projects.find((p) => p.id === task.projectId)?.name || 'Project';
      list.push({
        id: `task-${task.id}`,
        category: 'Task',
        title: task.title,
        subtitle: `${projName} · ${task.status}`,
        onSelect: () => {
          onClose();
          navigate('/tasks');
        },
      });
    }

    const notePool = q ? notes.filter((n) => n.title.toLowerCase().includes(q)) : notes.slice(0, 4);
    for (const note of notePool.slice(0, 6)) {
      list.push({
        id: `note-${note.id}`,
        category: 'Note',
        title: note.title,
        subtitle: note.isCompleted ? 'Completed Post-it' : 'Active Post-it',
        onSelect: () => {
          onClose();
          navigate('/notes');
        },
      });
    }

    const filtered = q
      ? list.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.subtitle || '').toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
      : list.slice(0, 14);

    return filtered;
  }, [query, creatableProjects, projects, tasks, notes, currentUser, navigate, onClose, onOpenQuickCreate, onToggleTheme]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    let awaitingGo = false;
    let goTimer: number | undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpenPalette();
        return;
      }

      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
        } else if (e.key === 'Enter' && items[activeIndex]) {
          e.preventDefault();
          items[activeIndex].onSelect();
        }
        return;
      }

      if (isEditableTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (awaitingGo) {
        awaitingGo = false;
        if (goTimer) window.clearTimeout(goTimer);
        const goMap: Record<string, string> = {
          d: '/',
          p: '/projects',
          l: '/project-plan',
          t: '/tasks',
          i: '/timesheet',
        };
        if (goMap[key]) {
          e.preventDefault();
          navigate(goMap[key]);
        }
        return;
      }

      if (key === 'g') {
        awaitingGo = true;
        goTimer = window.setTimeout(() => {
          awaitingGo = false;
        }, 900);
      } else if (key === 'c' && creatableProjects.length > 0) {
        e.preventDefault();
        onOpenQuickCreate();
      } else if (key === 'l') {
        e.preventDefault();
        navigate('/timesheet', { state: { autoOpenLog: true } });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (goTimer) window.clearTimeout(goTimer);
    };
  }, [isOpen, items, activeIndex, creatableProjects.length, navigate, onClose, onOpenPalette, onOpenQuickCreate]);

  return { query, setQuery, activeIndex, setActiveIndex, items, creatableProjects };
};
