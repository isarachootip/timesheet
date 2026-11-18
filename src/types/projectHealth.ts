export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED' | 'COMPLETED';
export type HealthConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type HealthTrendDirection = 'UP' | 'DOWN' | 'FLAT' | 'NONE';
export type HealthFactorKey =
  | 'schedule'
  | 'overdue'
  | 'effort'
  | 'momentum'
  | 'freshness'
  | 'sprint';

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
  sprint?: number | null;
}

export interface AiRecommendationItem {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  expected_impact: string;
}

export interface AiHealthAnalysis {
  summary: string;
  root_causes: string[];
  recommendations: AiRecommendationItem[];
}

export interface ProjectHealthSummaryItem {
  projectId: string;
  calculatedAt: string;
  healthScore: number | null;
  overallProgress: number;
  status: HealthStatus;
  confidence: HealthConfidence;
  factors: HealthFactorScores;
  dataIssues: HealthDataIssue[];
  trend: HealthTrendDirection;
  scoreDelta: number | null;
  aiSummary?: string | null;
  aiTopAction?: string | null;
  aiAnalyzedAt?: string | null;
}

export interface ProjectHealthDetail extends ProjectHealthSummaryItem {
  snapshotId: string;
  factorDetails: Record<string, Record<string, unknown>>;
  aiAnalysis: AiHealthAnalysis | null;
  aiAnalyzedAt: string | null;
  aiError?: string | null;
}

export interface ProjectHealthHistoryPoint {
  id: string;
  projectId: string;
  snapshotDate: string;
  calculatedAt: string;
  healthScore: number | null;
  factors: HealthFactorScores;
  status: HealthStatus;
  confidence: HealthConfidence;
  dataIssues: HealthDataIssue[];
  aiAnalysis: AiHealthAnalysis | null;
  aiAnalyzedAt: string | null;
}
