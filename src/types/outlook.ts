import type { TaskPriority } from './index';

export interface OutlookCalendarEvent {
  outlookEventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startDateTime: string;
  endDateTime: string;
  estimatedHours: number;
  isAllDay: boolean;
  isRecurring: boolean;
  organizer: string;
  existingTaskId: string | null;
  existingProjectId: string | null;
}

export interface OutlookConnectionStatus {
  connected: boolean;
  msEmail: string | null;
  configured: boolean;
}

export interface OutlookImportItemPayload {
  outlookEventId: string;
  projectId: string;
  assigneeId: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority;
  estimatedHours: number;
  startDate: string;
  endDate: string;
  issueType: 'Bug' | 'Story' | 'Task' | 'Sub-task';
}

export interface OutlookImportResponse {
  success: boolean;
  createdCount: number;
  syncedCount: number;
  error?: string;
}
