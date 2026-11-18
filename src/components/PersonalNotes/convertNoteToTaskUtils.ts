import { z } from 'zod';
import type { PermissionScheme, PersonalNote, Project, Task, TaskPriority, User } from '../../types';
import { hasProjectPermission } from '../../utils/projectPermissions';

const convertNoteTaskSchema = z.object({
  projectId: z.string().trim().min(1, 'กรุณาเลือกโครงการ / Please select a project'),
  title: z.string().trim().min(1, 'กรุณาระบุชื่องาน / Task title is required').max(200),
  description: z.string().default(''),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  estimatedHours: z.number().min(0, 'ชั่วโมงประเมินต้องไม่ติดลบ'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  parentId: z.string().optional(),
  sprintId: z.string().optional(),
});

export const getCreatableProjectsForNote = (
  currentUser: User,
  projects: Project[],
  permissionSchemes: PermissionScheme[] = []
): Project[] =>
  projects.filter(
    (p) =>
      p.status !== 'Completed' &&
      hasProjectPermission(currentUser, projects, permissionSchemes, p.id, 'create_task')
  );

export const canConvertNoteToTask = (
  note: PersonalNote,
  currentUser: User,
  projects: Project[],
  permissionSchemes: PermissionScheme[] = []
): boolean => {
  if (note.isCompleted || Boolean(note.taskId)) return false;
  if (note.projectId) {
    return hasProjectPermission(
      currentUser,
      projects,
      permissionSchemes,
      note.projectId,
      'create_task'
    );
  }
  return getCreatableProjectsForNote(currentUser, projects, permissionSchemes).length > 0;
};

export interface BuildTaskFromNoteArgs {
  note: PersonalNote;
  projectId: string;
  assigneeId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  estimatedHours?: number;
  startDate?: string;
  endDate?: string;
  parentId?: string;
  sprintId?: string;
}

export const buildTaskPayloadFromNote = (args: BuildTaskFromNoteArgs): Task => {
  const validated = convertNoteTaskSchema.parse({
    projectId: args.projectId,
    title: args.title ?? args.note.title,
    description: args.description ?? args.note.content ?? '',
    priority: args.priority ?? 'Medium',
    estimatedHours: Number.isFinite(args.estimatedHours) ? args.estimatedHours : 2,
    startDate: args.startDate || args.note.noteDate || undefined,
    endDate: args.endDate || args.note.dueDate || undefined,
    parentId: args.parentId || undefined,
    sprintId: args.sprintId || undefined,
  });

  const nowIso = new Date().toISOString();
  return {
    id: `t_note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    projectId: validated.projectId,
    assigneeId: args.assigneeId,
    title: validated.title,
    description: validated.description,
    status: 'To Do',
    priority: validated.priority,
    estimatedHours: validated.estimatedHours,
    createdAt: nowIso,
    updatedAt: nowIso,
    startDate: validated.startDate,
    endDate: validated.endDate,
    parentId: validated.parentId,
    sprintId: validated.sprintId,
    issueType: validated.parentId ? 'Sub-task' : 'Task',
  };
};
