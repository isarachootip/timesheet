import type { DbQueryable } from './projectHealthEngine.js';

export function parseProjectMembers(rawMembers: unknown): Array<{ userId?: string; role?: string }>;
export function authenticateHealthUser(
  db: DbQueryable,
  userId: string
): Promise<{ userId: string; globalRole: string }>;
export function canUserBrowseProject(
  globalRole: string,
  projectRow: Record<string, unknown>,
  schemePermissions: Record<string, unknown> | null,
  userId: string
): boolean;
export function isUserPrivilegedOnProject(
  globalRole: string,
  projectRow: Record<string, unknown>,
  userId: string
): boolean;
export function assertCanViewProjectHealth(
  db: DbQueryable,
  userId: string,
  projectId: string
): Promise<void>;
export function assertCanAnalyzeProjectHealth(
  db: DbQueryable,
  userId: string,
  projectId: string
): Promise<void>;
