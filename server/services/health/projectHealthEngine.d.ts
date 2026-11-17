export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED' | 'COMPLETED';
export type HealthConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type HealthFactorKey = 'schedule' | 'overdue' | 'effort' | 'momentum' | 'freshness';

export interface HealthDataIssue {
  code: string;
  message: string;
  affectedFactors: HealthFactorKey[];
}

export interface HealthFactorScores {
  schedule: number | null;
  overdue: number | null;
  effort: number | null;
  momentum: number | null;
  freshness: number | null;
}

export interface ProjectHealthConfigOverrides {
  weights?: Partial<Record<HealthFactorKey, number>>;
  statusThresholds?: { greenMin?: number; yellowMin?: number };
  taskStatusProgress?: { todo?: number; inProgress?: number; review?: number; done?: number };
  terminalStatuses?: string[];
  schedule?: { overduePenaltyPointsPerStep?: number; overduePenaltyDaysStep?: number };
  momentum?: { lookbackDays?: number };
  freshness?: { tiers?: Array<{ maxDays: number; score: number }>; staleScore?: number };
  timesheetValidStatuses?: string[];
  confidenceThresholds?: { highMaxIssues?: number; mediumMaxIssues?: number };
}

export interface ProjectHealthResult {
  projectId: string;
  calculatedAt: string;
  healthScore: number | null;
  overallProgress: number;
  status: HealthStatus;
  confidence: HealthConfidence;
  factors: HealthFactorScores;
  factorDetails: Record<string, Record<string, unknown>>;
  dataIssues: HealthDataIssue[];
}

export interface EvaluateProjectHealthInput {
  project: Record<string, unknown> & { id: string };
  workflow?: Record<string, unknown> | null;
  tasks?: Array<Record<string, unknown>>;
  timesheets?: Array<Record<string, unknown>>;
  referenceDate?: Date | string;
}

export interface DbQueryable {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
}

export function evaluateProjectHealth(
  input: EvaluateProjectHealthInput,
  configOverrides?: ProjectHealthConfigOverrides
): ProjectHealthResult;

export function calculateProjectHealth(
  projectId: string,
  options?: {
    db?: DbQueryable;
    referenceDate?: Date | string;
    config?: ProjectHealthConfigOverrides;
  }
): Promise<ProjectHealthResult>;
