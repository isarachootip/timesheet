import type { z } from 'zod';

export declare const projectIdParamSchema: z.ZodObject<{ id: z.ZodString }>;
export declare const healthHistoryQuerySchema: z.ZodObject<{ limit: z.ZodDefault<z.ZodNumber> }>;
