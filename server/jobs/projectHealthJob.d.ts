import type { DbQueryable, ProjectHealthResult } from '../services/health/projectHealthEngine.js';

export interface DailyHealthJobResult {
  snapshotDate: string;
  processedCount: number;
  skippedCount: number;
  notificationsSent: number;
  aiAnalyzedCount: number;
}

export function shouldNotifyStatusColorChange(
  previousStatus: string | null | undefined,
  nextStatus: string | null | undefined
): boolean;

export function shouldAutoTriggerHealthAi(args: {
  previousStatus?: string | null;
  nextStatus?: string | null;
  hasTodayAi?: boolean;
}): boolean;

export function runDailyProjectHealthJob(options?: {
  db?: DbQueryable;
  referenceDate?: Date | string;
  aiAnalyzer?: (
    projectId: string,
    liveHealth: ProjectHealthResult,
    ctx: { db: DbQueryable; referenceDate: Date }
  ) => Promise<Record<string, unknown> | null>;
}): Promise<DailyHealthJobResult>;

export function startProjectHealthScheduler(options?: {
  db?: DbQueryable;
  checkIntervalMs?: number;
}): { stop: () => void };
