import type {
  ProjectHealthDetail,
  ProjectHealthHistoryPoint,
  ProjectHealthSummaryItem,
} from '../types/projectHealth';

const isRecord = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null;

const extractApiError = (payload: unknown, fallback: string): string =>
  isRecord(payload) && typeof payload.error === 'string' ? payload.error : fallback;

export const fetchProjectsHealthSummary = async (
  userId: string
): Promise<ProjectHealthSummaryItem[]> => {
  const res = await fetch('/api/projects/health', {
    headers: { 'X-User-Id': userId },
  });
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractApiError(payload, 'ไม่สามารถโหลดข้อมูลสรุปสุขภาพโครงการได้'));
  }
  return Array.isArray(payload) ? (payload as ProjectHealthSummaryItem[]) : [];
};

export const fetchProjectHealthDetail = async (
  userId: string,
  projectId: string
): Promise<ProjectHealthDetail> => {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/health`, {
    headers: { 'X-User-Id': userId },
  });
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractApiError(payload, 'ไม่สามารถโหลดรายละเอียดสุขภาพโครงการได้'));
  }
  return payload as ProjectHealthDetail;
};

export const fetchProjectHealthHistory = async (
  userId: string,
  projectId: string,
  limit = 30
): Promise<ProjectHealthHistoryPoint[]> => {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/health/history?limit=${limit}`,
    { headers: { 'X-User-Id': userId } }
  );
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractApiError(payload, 'ไม่สามารถโหลดประวัติแนวโน้มสุขภาพโครงการได้'));
  }
  return Array.isArray(payload) ? (payload as ProjectHealthHistoryPoint[]) : [];
};

export const triggerProjectHealthAiAnalysis = async (
  userId: string,
  projectId: string
): Promise<ProjectHealthDetail> => {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/health/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
  });
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractApiError(payload, 'การวิเคราะห์ด้วย AI ไม่สำเร็จ'));
  }
  return payload as ProjectHealthDetail;
};
