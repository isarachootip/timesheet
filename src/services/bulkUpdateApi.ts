import type { ProjectStatus } from '../types';

export interface BulkSkippedItem {
  id: string;
  reason: string;
}

export interface BulkUpdateResult {
  updatedIds: string[];
  skipped: BulkSkippedItem[];
}

export interface BulkTasksPatch {
  status?: string;
  endDate?: string | null;
}

export interface BulkProjectsPatch {
  status?: ProjectStatus;
  endDate?: string | null;
}

const isRecord = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null;

const parseBulkResult = (raw: unknown): BulkUpdateResult => {
  if (!isRecord(raw)) {
    throw new Error('Invalid response from bulk update server.');
  }
  const updatedIds = Array.isArray(raw.updatedIds)
    ? raw.updatedIds.filter((x): x is string => typeof x === 'string')
    : [];
  const skipped = Array.isArray(raw.skipped)
    ? raw.skipped
        .filter(isRecord)
        .filter((s) => typeof s.id === 'string' && typeof s.reason === 'string')
        .map((s) => ({ id: String(s.id), reason: String(s.reason) }))
    : [];
  return { updatedIds, skipped };
};

export const bulkUpdateTasks = async (
  userId: string,
  taskIds: string[],
  patch: BulkTasksPatch
): Promise<BulkUpdateResult> => {
  const res = await fetch('/api/tasks/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({ taskIds, patch }),
  });

  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'Failed to bulk update tasks.';
    throw new Error(message);
  }
  return parseBulkResult(payload);
};

export const bulkUpdateProjects = async (
  userId: string,
  projectIds: string[],
  patch: BulkProjectsPatch
): Promise<BulkUpdateResult> => {
  const res = await fetch('/api/projects/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({ projectIds, patch }),
  });

  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'Failed to bulk update projects.';
    throw new Error(message);
  }
  return parseBulkResult(payload);
};
