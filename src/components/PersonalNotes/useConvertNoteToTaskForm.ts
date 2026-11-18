import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  PermissionScheme,
  PersonalNote,
  Project,
  Sprint,
  Task,
  TaskPriority,
  User,
} from '../../types';
import { toast } from '../ui/ToastProvider';
import {
  buildTaskPayloadFromNote,
  getCreatableProjectsForNote,
} from './convertNoteToTaskUtils';

interface UseConvertNoteToTaskFormParams {
  isOpen: boolean;
  note: PersonalNote | null;
  currentUser: User;
  projects: Project[];
  permissionSchemes: PermissionScheme[];
  tasks: Task[];
  sprints: Sprint[];
  onClose: () => void;
}

export function useConvertNoteToTaskForm({
  isOpen,
  note,
  currentUser,
  projects,
  permissionSchemes,
  tasks,
  sprints,
  onClose,
}: UseConvertNoteToTaskFormParams) {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [endDate, setEndDate] = useState('');
  const [parentId, setParentId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const availableProjects = useMemo(
    () => getCreatableProjectsForNote(currentUser, projects, permissionSchemes),
    [currentUser, projects, permissionSchemes]
  );

  const projectMilestones = useMemo(
    () => tasks.filter((t) => t.projectId === projectId && !t.parentId),
    [tasks, projectId]
  );

  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === projectId && s.status !== 'Completed'),
    [sprints, projectId]
  );

  useEffect(() => {
    if (!note || !isOpen) return;
    setTitle(note.title);
    setDescription(note.content || '');
    setPriority('Medium');
    setEstimatedHours('2');
    setEndDate(note.dueDate || '');
    setParentId('');
    setSprintId('');
    setErrorMsg('');

    if (note.projectId && availableProjects.some((p) => p.id === note.projectId)) {
      setProjectId(note.projectId);
    } else {
      setProjectId(availableProjects[0]?.id || '');
    }
  }, [note, isOpen, availableProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const parsedHours = Number.parseFloat(estimatedHours);
      const taskPayload = buildTaskPayloadFromNote({
        note,
        projectId,
        assigneeId: currentUser.id,
        title,
        description,
        priority,
        estimatedHours: Number.isFinite(parsedHours) ? parsedHours : 0,
        startDate: note.noteDate,
        endDate: endDate || undefined,
        parentId: parentId || undefined,
        sprintId: sprintId || undefined,
      });

      const taskRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify(taskPayload),
      });

      if (!taskRes.ok) {
        const errData = await taskRes.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถสร้าง Task ได้');
      }

      const linkRes = await fetch(`/api/notes/${note.id}/link-task`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({
          projectId: taskPayload.projectId,
          taskId: taskPayload.id,
        }),
      });

      if (!linkRes.ok) {
        const errData = await linkRes.json().catch(() => ({}));
        throw new Error(errData.error || 'สร้าง Task แล้ว แต่ผูกกลับมายัง Post-it ไม่สำเร็จ');
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['personal-notes', currentUser.id] });
      toast.success('แปลง Post-it เป็น Task สำเร็จ (พร้อมส่งต่อเข้า Timesheet ได้ทันที)');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง Task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    projectId,
    setProjectId: (nextId: string) => {
      setProjectId(nextId);
      setParentId('');
      setSprintId('');
    },
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    estimatedHours,
    setEstimatedHours,
    endDate,
    setEndDate,
    parentId,
    setParentId,
    sprintId,
    setSprintId,
    isSubmitting,
    errorMsg,
    availableProjects,
    projectMilestones,
    projectSprints,
    handleSubmit,
  };
}
