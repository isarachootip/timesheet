import { vi } from 'vitest';

export interface InMemoryHealthSeed {
  projects: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  timesheets?: Array<Record<string, unknown>>;
  sprints?: Array<Record<string, unknown>>;
  users?: Array<Record<string, unknown>>;
  permissionSchemes?: Array<Record<string, unknown>>;
  snapshots?: Array<Record<string, unknown>>;
}

export const buildInMemoryHealthDb = (seed: InMemoryHealthSeed) => {
  const snapshots = [...(seed.snapshots || [])];
  const notifications: Array<Record<string, unknown>> = [];

  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('FROM users WHERE id = $1')) {
      return { rows: (seed.users || []).filter((u) => u.id === params[0]) };
    }
    if (sql.includes('SELECT id, name FROM users')) {
      return { rows: seed.users || [] };
    }
    if (sql.includes('FROM permission_schemes')) {
      if (params.length > 0) {
        return { rows: (seed.permissionSchemes || []).filter((s) => s.id === params[0]) };
      }
      return { rows: seed.permissionSchemes || [] };
    }
    if (sql.includes('FROM projects WHERE LOWER(TRIM(status))')) {
      return { rows: seed.projects.filter((p) => String(p.status).toLowerCase() === 'active') };
    }
    if (sql.includes('FROM projects WHERE id = $1')) {
      return { rows: seed.projects.filter((p) => p.id === params[0]) };
    }
    if (sql.includes('SELECT * FROM projects')) {
      return { rows: seed.projects };
    }
    if (sql.includes('FROM project_workflows')) {
      return { rows: [] };
    }
    if (sql.includes('FROM sprints WHERE project_id = $1')) {
      return { rows: (seed.sprints || []).filter((s) => s.project_id === params[0]) };
    }
    if (sql.includes('SELECT * FROM sprints')) {
      return { rows: seed.sprints || [] };
    }
    if (sql.includes('FROM tasks WHERE project_id = $1')) {
      return { rows: seed.tasks.filter((t) => t.project_id === params[0]) };
    }
    if (sql.includes('SELECT * FROM tasks')) {
      return { rows: seed.tasks };
    }
    if (sql.includes('FROM timesheets WHERE project_id = $1')) {
      return { rows: (seed.timesheets || []).filter((ts) => ts.project_id === params[0]) };
    }
    if (sql.includes('FROM timesheets WHERE COALESCE')) {
      return { rows: (seed.timesheets || []).filter((ts) => !ts.is_personal) };
    }
    if (sql.includes('INSERT INTO project_health_snapshots')) {
      const row = {
        id: params[0],
        project_id: params[1],
        snapshot_date: params[2],
        calculated_at: params[3],
        health_score: params[4],
        factor_scores: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
        status: params[6],
        confidence: params[7],
        data_issues: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
        ai_analysis: params[9]
          ? typeof params[9] === 'string'
            ? JSON.parse(params[9] as string)
            : params[9]
          : null,
        ai_analyzed_at: params[10] || null,
        trigger_source: params[11],
      };
      snapshots.push(row);
      return { rows: [row] };
    }
    if (sql.includes('WHERE project_id = $1 AND snapshot_date = $2 AND trigger_source')) {
      const found = snapshots.filter(
        (s) => s.project_id === params[0] && s.snapshot_date === params[1] && s.trigger_source === 'scheduled'
      );
      return { rows: found };
    }
    if (sql.includes('WHERE project_id = $1 AND snapshot_date = $2 AND ai_analysis IS NOT NULL')) {
      const found = snapshots.filter(
        (s) => s.project_id === params[0] && s.snapshot_date === params[1] && s.ai_analysis !== null
      );
      return { rows: found.slice(0, 1) };
    }
    if (sql.includes('ANY($1::varchar[])') && sql.includes('ai_analysis IS NOT NULL')) {
      const ids = new Set((params[0] as string[]) || []);
      const grouped = new Map<string, Record<string, unknown>>();
      const sorted = [...snapshots]
        .filter((s) => ids.has(String(s.project_id)) && s.ai_analysis !== null)
        .sort((a, b) => String(b.calculated_at).localeCompare(String(a.calculated_at)));
      for (const row of sorted) {
        const pid = String(row.project_id);
        if (!grouped.has(pid)) grouped.set(pid, row);
      }
      return { rows: Array.from(grouped.values()) };
    }
    if (sql.includes('ROW_NUMBER() OVER (PARTITION BY project_id')) {
      const byProj = new Map<string, Array<Record<string, unknown>>>();
      const sorted = [...snapshots].sort((a, b) =>
        String(b.calculated_at).localeCompare(String(a.calculated_at))
      );
      for (const row of sorted) {
        const pid = String(row.project_id);
        const list = byProj.get(pid) || [];
        if (list.length < 2) list.push(row);
        byProj.set(pid, list);
      }
      return { rows: Array.from(byProj.values()).flat() };
    }
    if (sql.includes('WHERE project_id = $1 AND ai_analysis IS NOT NULL')) {
      const withAi = snapshots
        .filter((s) => s.project_id === params[0] && s.ai_analysis !== null)
        .sort((a, b) => String(b.calculated_at).localeCompare(String(a.calculated_at)));
      return { rows: withAi.slice(0, 1) };
    }
    if (sql.includes('WHERE project_id = $1 AND id != $2')) {
      const prev = snapshots
        .filter((s) => s.project_id === params[0] && s.id !== params[1])
        .sort((a, b) => String(b.calculated_at).localeCompare(String(a.calculated_at)));
      return { rows: prev.slice(0, 1) };
    }
    if (sql.includes('FROM project_health_snapshots') && sql.includes('LIMIT $2')) {
      const limit = Number(params[1]) || 30;
      const list = snapshots
        .filter((s) => s.project_id === params[0])
        .sort((a, b) => String(b.calculated_at).localeCompare(String(a.calculated_at)))
        .slice(0, limit);
      return { rows: list };
    }
    if (sql.includes('FROM project_health_snapshots') && sql.includes('LIMIT 1')) {
      const latest = snapshots
        .filter((s) => s.project_id === params[0])
        .sort((a, b) => String(b.calculated_at).localeCompare(String(a.calculated_at)));
      return { rows: latest.slice(0, 1) };
    }
    if (sql.includes('INSERT INTO chat_notifications')) {
      const notif = {
        id: params[0],
        user_id: params[1],
        project_id: params[2],
        text: params[3],
        type: params[4],
      };
      notifications.push(notif);
      return { rows: [notif] };
    }
    return { rows: [] };
  });

  return { db: { query }, snapshots, notifications };
};
