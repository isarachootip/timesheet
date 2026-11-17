import { describe, it, expect, vi } from 'vitest';
import {
  assertCanViewProjectHealth,
  assertCanAnalyzeProjectHealth,
} from '../projectHealthPermissions.js';
import {
  projectIdParamSchema,
  healthHistoryQuerySchema,
} from '../../../schemas/projectHealthSchemas.js';

const createAuthMockDb = (seed: {
  users: Array<{ id: string; global_role: string }>;
  projects: Array<{ id: string; members: Array<{ userId: string; role: string }>; permission_scheme_id?: string }>;
}) => {
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('FROM users WHERE id = $1')) {
      return { rows: seed.users.filter((u) => u.id === params[0]) };
    }
    if (sql.includes('FROM projects WHERE id = $1')) {
      return { rows: seed.projects.filter((p) => p.id === params[0]) };
    }
    if (sql.includes('FROM permission_schemes WHERE id = $1')) {
      return {
        rows: [
          {
            id: 'scheme_default',
            permissions: {
              browse_project: ['Admin', 'Manager', 'PM', 'Team Lead', 'Member'],
            },
          },
        ],
      };
    }
    return { rows: [] };
  });
  return { query };
};

describe('Step 2: Project Health RBAC & Zod Schemas', () => {
  it('validates route params and history query parameters with Zod', () => {
    expect(projectIdParamSchema.safeParse({ id: '' }).success).toBe(false);
    expect(projectIdParamSchema.safeParse({ id: 'p_123' }).success).toBe(true);

    const parsedDefault = healthHistoryQuerySchema.parse({});
    expect(parsedDefault.limit).toBe(30);

    const parsedCustom = healthHistoryQuerySchema.parse({ limit: '60' });
    expect(parsedCustom.limit).toBe(60);

    expect(healthHistoryQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(healthHistoryQuerySchema.safeParse({ limit: '999' }).success).toBe(false);
  });

  it('enforces browse_project for GET and PM/Manager/Admin for POST analyze', async () => {
    const db = createAuthMockDb({
      users: [
        { id: 'u_admin', global_role: 'Admin' },
        { id: 'u_pm', global_role: 'Employee' },
        { id: 'u_dev', global_role: 'Employee' },
        { id: 'u_outsider', global_role: 'Employee' },
      ],
      projects: [
        {
          id: 'p1',
          members: [
            { userId: 'u_pm', role: 'PM' },
            { userId: 'u_dev', role: 'Backend dev' },
          ],
        },
      ],
    });

    // Missing userId -> 401
    await expect(assertCanViewProjectHealth(db, '', 'p1')).rejects.toMatchObject({ statusCode: 401 });
    // Missing project -> 404
    await expect(assertCanViewProjectHealth(db, 'u_admin', 'p_missing')).rejects.toMatchObject({ statusCode: 404 });
    // Outsider -> 403 on view
    await expect(assertCanViewProjectHealth(db, 'u_outsider', 'p1')).rejects.toMatchObject({ statusCode: 403 });
    // Project developer -> allowed on view, 403 on analyze
    await expect(assertCanViewProjectHealth(db, 'u_dev', 'p1')).resolves.toBeUndefined();
    await expect(assertCanAnalyzeProjectHealth(db, 'u_dev', 'p1')).rejects.toMatchObject({ statusCode: 403 });
    // Project PM & Global Admin -> allowed on analyze
    await expect(assertCanAnalyzeProjectHealth(db, 'u_pm', 'p1')).resolves.toBeUndefined();
    await expect(assertCanAnalyzeProjectHealth(db, 'u_admin', 'p1')).resolves.toBeUndefined();
  });
});
