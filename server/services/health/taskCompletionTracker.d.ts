export interface ResolveTaskCompletedAtArgs {
  oldTask?: {
    status?: string;
    completed_at?: string | Date | null;
    completedAt?: string | Date | null;
  } | null;
  nextStatus: string;
  project?: Record<string, unknown> | null;
  workflow?: Record<string, unknown> | null;
  nowIso?: string;
}

export function resolveTaskCompletedAt(args: ResolveTaskCompletedAtArgs): string | null;
