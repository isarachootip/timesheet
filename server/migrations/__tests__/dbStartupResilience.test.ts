import { describe, expect, it, vi } from 'vitest';
import zlib from 'zlib';
import { runProjectHealthMigration } from '../projectHealthMigration.js';
import { resolveTaskCompletedAt } from '../../services/health/taskCompletionTracker.js';
import { withPoolClient } from '../../config/dbPool.js';
import { gzipJsonMiddleware } from '../../middleware/compressionMiddleware.js';

describe('DB Startup & Migration Resilience', () => {
  it('formats PostgreSQL Date columns as <= 50-char ISO strings and batches completed_at updates', async () => {
    const updateCalls: Array<{ sql: string; params: unknown[] }> = [];

    const query = vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('SELECT id FROM migrations')) {
        return { rows: [] };
      }
      if (sql.includes('SELECT id, custom_columns FROM projects')) {
        return { rows: [{ id: 'p1', custom_columns: ['To Do', 'In Progress', 'Done'] }] };
      }
      if (sql.includes('SELECT project_id, statuses FROM project_workflows')) {
        return { rows: [] };
      }
      if (sql.includes('FROM tasks WHERE completed_at IS NULL')) {
        return {
          rows: [
            {
              id: 't1',
              project_id: 'p1',
              status: 'Done',
              updated_at: new Date('2026-07-08T03:58:00.650Z'),
              created_at: new Date('2026-07-05T19:57:34.056Z'),
            },
            {
              id: 't2',
              project_id: 'p1',
              status: 'Done',
              updated_at: null,
              created_at: new Date('2026-07-14T20:47:21.277Z'),
            },
            {
              id: 't3',
              project_id: 'p1',
              status: 'In Progress',
              updated_at: new Date('2026-07-15T10:00:00.000Z'),
              created_at: new Date('2026-07-15T09:00:00.000Z'),
            },
          ],
        };
      }
      if (sql.trim().toUpperCase().startsWith('UPDATE TASKS')) {
        updateCalls.push({ sql, params });
        return { rows: [], rowCount: 2 };
      }
      return { rows: [] };
    });

    await runProjectHealthMigration({ query });

    // Must batch into 1 UPDATE query instead of N sequential round-trips
    expect(updateCalls).toHaveLength(1);

    const [idsParam, timestampsParam] = updateCalls[0].params as [string[], string[]];
    expect(idsParam).toEqual(['t1', 't2']);
    expect(timestampsParam).toEqual([
      '2026-07-08T03:58:00.650Z',
      '2026-07-14T20:47:21.277Z',
    ]);
    for (const ts of timestampsParam) {
      expect(ts.length).toBeLessThanOrEqual(50);
    }
  });

  it('normalizes Date objects in resolveTaskCompletedAt to ISO-8601 <= 50 chars', () => {
    const result = resolveTaskCompletedAt({
      oldTask: {
        status: 'Done',
        completed_at: new Date('2026-07-08T03:58:00.650Z'),
      },
      nextStatus: 'Done',
      project: { custom_columns: ['To Do', 'Done'] },
      workflow: null,
      nowIso: '2026-11-17T15:00:00.000Z',
    });

    expect(result).toBe('2026-07-08T03:58:00.650Z');
    expect(result!.length).toBeLessThanOrEqual(50);
  });

  it('always releases checked-out pg PoolClient in withPoolClient even when callback throws', async () => {
    const release = vi.fn();
    const mockClient = { query: vi.fn(), release };
    const mockPool = { connect: vi.fn(async () => mockClient) };

    await expect(
      withPoolClient(mockPool, async () => {
        throw new Error('value too long for type character varying(50)');
      })
    ).rejects.toThrow('value too long for type character varying(50)');

    expect(mockPool.connect).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('compresses large JSON payloads with gzip when client accepts gzip', () => {
    const headers = new Map<string, string>();
    let sentPayload: unknown = null;

    const req = { headers: { 'accept-encoding': 'gzip, deflate, br' } };
    const res = {
      getHeader: (name: string) => headers.get(name.toLowerCase()),
      setHeader: (name: string, val: string) => {
        headers.set(name.toLowerCase(), val);
      },
      json: vi.fn((body: unknown) => {
        sentPayload = body;
        return res;
      }),
      send: vi.fn((buf: unknown) => {
        sentPayload = buf;
        return res;
      }),
    };
    const next = vi.fn();

    gzipJsonMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    const largeData = Array.from({ length: 100 }, (_, i) => ({
      id: `ts_${i}`,
      description: 'Repeated timesheet payload segment for compression verification',
    }));
    res.json(largeData);

    expect(headers.get('content-encoding')).toBe('gzip');
    expect(headers.get('content-type')).toContain('application/json');
    expect(Buffer.isBuffer(sentPayload)).toBe(true);
    const unzipped = JSON.parse(zlib.gunzipSync(sentPayload as Buffer).toString('utf8'));
    expect(unzipped).toHaveLength(100);
  });
});
