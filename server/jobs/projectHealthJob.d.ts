import type { DbQueryable } from '../services/health/projectHealthEngine.js';

export interface DailyHealthJobResult {
  snapshotDate: string;
  processedCount: number;
  skippedCount: number;
  notificationsSent: number;
}

export function shouldNotifyStatusColorChange(
  previousStatus: string | null | undefined,
  nextStatus: string | null | undefined
): boolean;

export function runDailyProjectHealthJob(options?: {
  db?: DbQueryable;
  referenceDate?: Date | string;
}): Promise<DailyHealthJobResult>;

export function startProjectHealthScheduler(options?: {
  db?: DbQueryable;
  checkIntervalMs?: number;
}): { stop: () => void };
