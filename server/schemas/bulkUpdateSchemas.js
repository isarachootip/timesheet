import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const optionalEndDateSchema = z
  .union([
    z.string().regex(isoDatePattern, 'endDate must be YYYY-MM-DD'),
    z.null(),
  ])
  .optional();

export const bulkTasksUpdateSchema = z
  .object({
    taskIds: z
      .array(z.string().min(1, 'Task ID cannot be empty'))
      .min(1, 'At least one taskId is required')
      .max(500, 'Cannot bulk update more than 500 tasks at once'),
    patch: z
      .object({
        status: z.string().trim().min(1, 'Status cannot be empty').optional(),
        endDate: optionalEndDateSchema,
      })
      .refine(
        (p) => p.status !== undefined || p.endDate !== undefined,
        'Patch must specify status or endDate'
      ),
  });

export const bulkProjectsUpdateSchema = z
  .object({
    projectIds: z
      .array(z.string().min(1, 'Project ID cannot be empty'))
      .min(1, 'At least one projectId is required')
      .max(200, 'Cannot bulk update more than 200 projects at once'),
    patch: z
      .object({
        status: z.enum(['Planning', 'Active', 'On Hold', 'Completed']).optional(),
        endDate: optionalEndDateSchema,
      })
      .refine(
        (p) => p.status !== undefined || p.endDate !== undefined,
        'Patch must specify status or endDate'
      ),
  });
