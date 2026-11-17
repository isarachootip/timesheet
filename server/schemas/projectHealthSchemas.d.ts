import type { z } from 'zod';

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

export declare const projectIdParamSchema: z.ZodObject<{ id: z.ZodString }>;
export declare const healthHistoryQuerySchema: z.ZodObject<{ limit: z.ZodDefault<z.ZodNumber> }>;
export declare const aiRecommendationItemSchema: z.ZodType<AiRecommendationItem>;
export declare const aiHealthAnalysisSchema: z.ZodType<AiHealthAnalysis>;
