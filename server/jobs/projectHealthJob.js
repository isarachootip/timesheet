import { calculateProjectHealth } from '../services/health/projectHealthEngine.js';
import { runProjectHealthAiForSnapshot } from '../services/health/projectHealthAiService.js';
import {
  getLatestHealthSnapshot,
  hasAiSnapshotForDate,
  hasScheduledSnapshotForDate,
  insertHealthSnapshot,
  insertPmHealthNotifications,
} from '../repositories/projectHealthRepository.js';

const COLOR_STATUSES = new Set(['GREEN', 'YELLOW', 'RED']);
const RISK_STATUSES = new Set(['YELLOW', 'RED']);
const DEFAULT_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export const shouldNotifyStatusColorChange = (previousStatus, nextStatus) => {
  if (!previousStatus || !nextStatus) return false;
  if (previousStatus === nextStatus) return false;
  return COLOR_STATUSES.has(previousStatus) && COLOR_STATUSES.has(nextStatus);
};

export const shouldAutoTriggerHealthAi = ({ previousStatus, nextStatus, hasTodayAi }) => {
  if (!nextStatus || nextStatus === 'COMPLETED') return false;
  if (shouldNotifyStatusColorChange(previousStatus, nextStatus)) return true;
  if (RISK_STATUSES.has(nextStatus) && !hasTodayAi) return true;
  return false;
};

export const runDailyProjectHealthJob = async (options = {}) => {
  const db = options.db || (await import('../config/db.js')).pool;
  const aiAnalyzer = options.aiAnalyzer || runProjectHealthAiForSnapshot;
  const nowDate =
    options.referenceDate instanceof Date
      ? options.referenceDate
      : options.referenceDate
        ? new Date(options.referenceDate)
        : new Date();
  const snapshotDate = nowDate.toISOString().slice(0, 10);

  const activeProjectsRes = await db.query(
    "SELECT * FROM projects WHERE LOWER(TRIM(status)) = 'active'"
  );

  let processedCount = 0;
  let skippedCount = 0;
  let notificationsSent = 0;
  let aiAnalyzedCount = 0;

  for (const project of activeProjectsRes.rows) {
    try {
      const alreadyDone = await hasScheduledSnapshotForDate(db, project.id, snapshotDate);
      if (alreadyDone) {
        skippedCount += 1;
        continue;
      }

      const previousSnapshot = await getLatestHealthSnapshot(db, project.id);
      const liveHealth = await calculateProjectHealth(project.id, {
        db,
        referenceDate: nowDate,
      });

      const hasTodayAi = await hasAiSnapshotForDate(db, project.id, snapshotDate);
      let aiAnalysis = null;
      if (
        shouldAutoTriggerHealthAi({
          previousStatus: previousSnapshot?.status,
          nextStatus: liveHealth.status,
          hasTodayAi,
        })
      ) {
        try {
          aiAnalysis = await aiAnalyzer(project.id, liveHealth, { db, referenceDate: nowDate });
          if (aiAnalysis) aiAnalyzedCount += 1;
        } catch (aiErr) {
          console.warn(
            `[ProjectHealthJob] AI analysis skipped for ${project.id}:`,
            aiErr instanceof Error ? aiErr.message : aiErr
          );
        }
      }

      const nowIso = nowDate.toISOString();
      await insertHealthSnapshot(db, {
        ...liveHealth,
        snapshotDate,
        calculatedAt: nowIso,
        aiAnalysis,
        aiAnalyzedAt: aiAnalysis ? nowIso : null,
        triggerSource: 'scheduled',
      });
      processedCount += 1;

      if (
        previousSnapshot &&
        shouldNotifyStatusColorChange(previousSnapshot.status, liveHealth.status)
      ) {
        const sent = await insertPmHealthNotifications(db, {
          project,
          previousStatus: previousSnapshot.status,
          nextStatus: liveHealth.status,
          healthScore: liveHealth.healthScore,
        });
        notificationsSent += sent;
      }
    } catch (err) {
      console.error(`[ProjectHealthJob] Error evaluating project ${project.id}:`, err);
    }
  }

  return { snapshotDate, processedCount, skippedCount, notificationsSent, aiAnalyzedCount };
};

export const startProjectHealthScheduler = (options = {}) => {
  const intervalMs =
    Number(process.env.HEALTH_JOB_INTERVAL_MS) ||
    options.checkIntervalMs ||
    DEFAULT_CHECK_INTERVAL_MS;

  let running = false;
  const executeSafely = async () => {
    if (running) return;
    running = true;
    try {
      const { dbReady, pool } = await import('../config/db.js');
      if (!options.db && !dbReady) return;
      await runDailyProjectHealthJob({ db: options.db || pool });
    } catch (err) {
      console.error('[ProjectHealthJob] Scheduled execution error:', err);
    } finally {
      running = false;
    }
  };

  const bootTimer = setTimeout(executeSafely, 15_000);
  const intervalTimer = setInterval(executeSafely, intervalMs);
  if (typeof bootTimer.unref === 'function') bootTimer.unref();
  if (typeof intervalTimer.unref === 'function') intervalTimer.unref();

  return {
    stop: () => {
      clearTimeout(bootTimer);
      clearInterval(intervalTimer);
    },
  };
};
