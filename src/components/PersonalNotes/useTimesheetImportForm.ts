import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PersonalNote, Project, Task, User } from '../../types';
import { convertNoteToTimesheetDraft, validateTimesheetDraft } from './importNoteUtils';

interface UseTimesheetImportFormParams {
  isOpen: boolean;
  note: PersonalNote | null;
  currentUser: User;
  projects: Project[];
  tasks: Task[];
  onClose: () => void;
  onCompleteNote?: (noteId: string) => Promise<unknown>;
}

export function useTimesheetImportForm({
  isOpen,
  note,
  currentUser,
  projects,
  tasks,
  onClose,
  onCompleteNote,
}: UseTimesheetImportFormParams) {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('1');
  const [description, setDescription] = useState('');
  const [workResults, setWorkResults] = useState('');
  const [isWfh, setIsWfh] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);
  const [markAsCompleted, setMarkAsCompleted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const availableProjects = useMemo(() => {
    if (currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') return projects;
    return projects.filter((p) => p.members?.some((m) => m.userId === currentUser.id));
  }, [projects, currentUser]);

  const availableTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter((t) => {
      if (t.projectId !== projectId) return false;
      if (currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') return true;
      return !t.assigneeId || t.assigneeId === currentUser.id;
    });
  }, [tasks, projectId, currentUser]);

  useEffect(() => {
    if (note && isOpen) {
      setDescription(note.title);
      setWorkResults(note.content || '');
      setDate(note.noteDate || new Date().toISOString().split('T')[0]);
      setHours('1');
      setIsPersonal(false);
      setMarkAsCompleted(true);
      setErrorMsg('');
      if (note.projectId) {
        setProjectId(note.projectId);
      } else if (availableProjects.length > 0 && !projectId) {
        setProjectId(availableProjects[0].id);
      }
      if (note.taskId) {
        setTaskId(note.taskId);
      }
    }
  }, [note, isOpen, availableProjects, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;
    setErrorMsg('');

    const numHours = parseFloat(hours);
    const validation = validateTimesheetDraft({
      projectId,
      hours: numHours,
      description,
      date,
      isPersonal,
    });
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Please check input');
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = convertNoteToTimesheetDraft({
        note: { ...note, title: description, content: workResults },
        userId: currentUser.id,
        projectId: isPersonal ? undefined : projectId,
        taskId: isPersonal ? undefined : (taskId || undefined),
        hours: numHours,
        date,
        isWfh,
        isPersonal,
      });

      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify(entry),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save timesheet');
      }

      // Link timesheet to note and mark completed automatically
      await fetch(`/api/notes/${note.id}/link-timesheet`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({
          timesheetId: entry.id,
          markCompleted: true,
        }),
      });

      if (markAsCompleted && !note.isCompleted && onCompleteNote) {
        await onCompleteNote(note.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      await queryClient.invalidateQueries({ queryKey: ['personal-notes', currentUser.id] });

      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    projectId,
    setProjectId,
    taskId,
    setTaskId,
    date,
    setDate,
    hours,
    setHours,
    description,
    setDescription,
    workResults,
    setWorkResults,
    isWfh,
    setIsWfh,
    isPersonal,
    setIsPersonal,
    markAsCompleted,
    setMarkAsCompleted,
    isSubmitting,
    errorMsg,
    availableProjects,
    availableTasks,
    handleSubmit,
  };
}
