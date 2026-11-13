const STATUS_RANK = {
  done: 4,
  completed: 4,
  review: 3,
  'in progress': 2,
  in_progress: 2,
  'to do': 1,
  todo: 1,
};

function getActivityScore(row) {
  const subs = Number(row.sub_cnt || 0);
  const ts = Number(row.ts_cnt || 0);
  const commits = Number(row.commit_cnt || 0);
  const notes = Number(row.note_cnt || 0);
  return subs * 1000 + ts * 100 + commits * 10 + notes;
}

function getStatusRank(status) {
  const key = String(status || '').trim().toLowerCase();
  return STATUS_RANK[key] ?? 0;
}

function compareCandidatePriority(a, b) {
  const activityDiff = getActivityScore(b) - getActivityScore(a);
  if (activityDiff !== 0) return activityDiff;

  const statusDiff = getStatusRank(b.status) - getStatusRank(a.status);
  if (statusDiff !== 0) return statusDiff;

  const timeA = a.created_at ? new Date(a.created_at).getTime() : Number.MAX_SAFE_INTEGER;
  const timeB = b.created_at ? new Date(b.created_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (timeA !== timeB) return timeA - timeB;

  return String(a.id).localeCompare(String(b.id));
}

/**
 * Group duplicate root milestones sharing (project_id, normalized title)
 * and select a deterministic canonical row to survive merge.
 */
export function groupDuplicateMilestones(rows) {
  const groups = new Map();

  for (const row of rows) {
    if (!row || !row.project_id || !row.title) continue;
    const normalizedTitle = String(row.title).trim().toLowerCase();
    if (!normalizedTitle) continue;
    const key = `${row.project_id}::${normalizedTitle}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const plans = [];
  for (const items of groups.values()) {
    if (items.length < 2) continue;
    const sorted = [...items].sort(compareCandidatePriority);
    const canonical = sorted[0];
    const trimmed = String(canonical.title).trim();
    plans.push({
      projectId: canonical.project_id,
      canonicalId: canonical.id,
      canonicalTitleTrimmed: trimmed,
      trimCanonicalTitle: canonical.title !== trimmed,
      redundantIds: sorted.slice(1).map((item) => item.id),
    });
  }

  return plans;
}

async function mergeMilestoneGroup(client, plan) {
  const { canonicalId, canonicalTitleTrimmed, trimCanonicalTitle, redundantIds } = plan;

  await client.query(
    'UPDATE tasks SET parent_id = $1 WHERE parent_id = ANY($2)',
    [canonicalId, redundantIds]
  );
  await client.query(
    'UPDATE timesheets SET task_id = $1 WHERE task_id = ANY($2)',
    [canonicalId, redundantIds]
  );
  await client.query(
    'UPDATE task_commits SET task_id = $1 WHERE task_id = ANY($2)',
    [canonicalId, redundantIds]
  );
  await client.query(
    'UPDATE personal_notes SET task_id = $1 WHERE task_id = ANY($2)',
    [canonicalId, redundantIds]
  );

  // Deduplicate baseline snapshots per baseline_id before updating task_id
  await client.query(
    `DELETE FROM task_snapshots
     WHERE id IN (
       SELECT id FROM (
         SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY baseline_id
             ORDER BY CASE WHEN task_id = $1 THEN 0 ELSE 1 END, id
           ) AS rn
         FROM task_snapshots
         WHERE task_id = $1 OR task_id = ANY($2)
       ) ranked
       WHERE ranked.rn > 1
     )`,
    [canonicalId, redundantIds]
  );
  await client.query(
    'UPDATE task_snapshots SET task_id = $1 WHERE task_id = ANY($2)',
    [canonicalId, redundantIds]
  );

  if (trimCanonicalTitle) {
    await client.query(
      'UPDATE tasks SET title = $1 WHERE id = $2',
      [canonicalTitleTrimmed, canonicalId]
    );
  }

  await client.query('DELETE FROM tasks WHERE id = ANY($1)', [redundantIds]);
}

/**
 * Safely re-link dependent records and remove duplicate root milestones inside a transaction.
 */
export async function deduplicateMilestones(client) {
  const res = await client.query(`
    SELECT
      t.id,
      t.project_id,
      t.title,
      t.status,
      t.created_at,
      (SELECT COUNT(*)::int FROM tasks c WHERE c.parent_id = t.id) AS sub_cnt,
      (SELECT COUNT(*)::int FROM timesheets ts WHERE ts.task_id = t.id) AS ts_cnt,
      (SELECT COUNT(*)::int FROM task_commits tc WHERE tc.task_id = t.id) AS commit_cnt,
      (SELECT COUNT(*)::int FROM personal_notes pn WHERE pn.task_id = t.id) AS note_cnt
    FROM tasks t
    WHERE t.parent_id IS NULL
  `);

  const plans = groupDuplicateMilestones(res.rows);
  if (plans.length === 0) {
    return { mergedGroups: 0, deletedTasks: 0 };
  }

  let deletedTasks = 0;
  await client.query('BEGIN');
  try {
    for (const plan of plans) {
      await mergeMilestoneGroup(client, plan);
      deletedTasks += plan.redundantIds.length;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  return { mergedGroups: plans.length, deletedTasks };
}
