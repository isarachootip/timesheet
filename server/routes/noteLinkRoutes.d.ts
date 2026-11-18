import type express from 'express';

export interface MappedPersonalNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  noteDate: string;
  dueDate: string;
  color: string;
  isCompleted: boolean;
  workType: string;
  projectId?: string;
  taskId?: string;
  timesheetId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function mapRowToNote(r: Record<string, unknown>): MappedPersonalNote;

export function executeLinkNoteToTask(
  db: { query: (sql: string, params?: unknown[]) => Promise<{ rowCount?: number | null; rows: Record<string, unknown>[] }> },
  args: { noteId: string; userId: unknown; body: unknown }
): Promise<MappedPersonalNote>;

declare const router: express.Router;
export default router;
