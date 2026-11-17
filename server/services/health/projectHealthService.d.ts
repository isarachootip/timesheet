import type { DbQueryable, ProjectHealthResult } from './projectHealthEngine.js';

export type HealthTrendDirection = 'UP' | 'DOWN' | 'FLAT' | 'NONE';

export interface ProjectHealthSnapshotRecord extends ProjectHealthResult {
  id: string;
  snapshotDate: string;
  aiAnalysis: Record<string, unknown> | null;
  aiAnalyzedAt: string | null;
  triggerSource: string;
}

export interface ProjectHealthLatestResponse extends ProjectHealthResult {
  snapshotId: string;
  trend: HealthTrendDirection;
  scoreDelta: number | null;
  aiAnalysis: Record<string, unknown> | null;
  aiAnalyzedAt: string | null;
  aiError?: string | null;
}

export interface ProjectHealthServiceDeps {
  db?: DbQueryable;
  referenceDate?: Date | string;
  aiAnalyzer?: (
    projectId: string,
    liveHealth: ProjectHealthResult,
    ctx: { db: DbQueryable; referenceDate: Date | string }
  ) => Promise<Record<string, unknown> | null>;
}

export function computeScoreTrend(
  currentScore: number | null | undefined,
  previousScore: number | null | undefined
): { trend: HealthTrendDirection; scoreDelta: number | null };

export function getProjectHealthLatest(
  deps: ProjectHealthServiceDeps,
  projectId: string
): Promise<ProjectHealthLatestResponse>;

export function getProjectHealthHistoryList(
  deps: ProjectHealthServiceDeps,
  projectId: string,
  options?: { limit?: number }
): Promise<ProjectHealthSnapshotRecord[]>;

export function analyzeAndSaveProjectHealth(
  deps: ProjectHealthServiceDeps,
  projectId: string
): Promise<ProjectHealthLatestResponse>;

export function getAllVisibleProjectsHealth(
  deps: ProjectHealthServiceDeps,
  userId: string
): Promise<Array<ProjectHealthResult & { trend: HealthTrendDirection; scoreDelta: number | null }>>;
