import { z } from 'zod';

export const timesheetLogQuerySchema = z.object({
  projectId: z.string().trim().min(1),
  action: z.literal('log'),
});

export const timesheetAutoOpenStateSchema = z.object({
  autoOpenLog: z.literal(true),
  projectId: z.string().trim().min(1).optional(),
  taskId: z.string().trim().min(1).optional(),
  taskTitle: z.string().optional(),
  workResults: z.string().optional(),
  date: z.string().optional(),
  noteId: z.string().trim().min(1).optional(),
});

export interface TimesheetAutoOpenIntent {
  source: 'query' | 'state';
  projectId?: string;
  taskId?: string;
  taskTitle?: string;
  workResults?: string;
  date?: string;
  noteId?: string;
}

export function parseTimesheetAutoOpenIntent(
  search: string,
  state: unknown
): TimesheetAutoOpenIntent | null {
  const params = new URLSearchParams(search);
  const queryCandidate = {
    projectId: params.get('projectId') ?? undefined,
    action: params.get('action') ?? undefined,
  };
  const parsedQuery = timesheetLogQuerySchema.safeParse(queryCandidate);
  if (parsedQuery.success) {
    return {
      source: 'query',
      projectId: parsedQuery.data.projectId,
    };
  }

  const parsedState = timesheetAutoOpenStateSchema.safeParse(state);
  if (parsedState.success) {
    return {
      source: 'state',
      projectId: parsedState.data.projectId,
      taskId: parsedState.data.taskId,
      taskTitle: parsedState.data.taskTitle,
      workResults: parsedState.data.workResults,
      date: parsedState.data.date,
      noteId: parsedState.data.noteId,
    };
  }

  return null;
}
