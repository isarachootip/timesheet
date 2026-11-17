import { z } from 'zod';

export const projectIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Project ID is required.'),
});

export const healthHistoryQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('limit must be an integer.')
    .min(1, 'limit must be at least 1.')
    .max(365, 'limit cannot exceed 365.')
    .default(30),
});

export const aiRecommendationItemSchema = z.object({
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  action: z.string().trim().min(1, 'recommendation action is required.'),
  expected_impact: z.string().trim().min(1, 'expected_impact is required.'),
});

export const aiHealthAnalysisSchema = z.object({
  summary: z.string().trim().min(1, 'summary is required.'),
  root_causes: z.array(z.string().trim().min(1)).max(10),
  recommendations: z
    .array(aiRecommendationItemSchema)
    .min(1, 'at least 1 recommendation is required.')
    .max(10),
});
