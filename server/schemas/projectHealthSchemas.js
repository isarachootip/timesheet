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
