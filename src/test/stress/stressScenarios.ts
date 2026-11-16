import type { StressConfig } from './stressConfig';
import { timedRequest } from './stressHttpClient';
import { computeScenarioSummary, type RequestSample, type ScenarioSummary } from './stressMetrics';

const APP_BOOT_ENDPOINTS = [
  '/api/users',
  '/api/projects',
  '/api/tasks',
  '/api/timesheets',
  '/api/task-templates',
  '/api/sprints',
  '/api/releases',
  '/api/permission-schemes',
  '/api/project-workflows',
  '/api/cost-rates',
  '/api/system-settings',
];

export const runMorningBootStorm = async (
  config: StressConfig,
  virtualUsers: number
): Promise<ScenarioSummary> => {
  const start = performance.now();
  const userPromises = Array.from({ length: virtualUsers }, async () => {
    const results = await Promise.all(
      APP_BOOT_ENDPOINTS.map((ep) => timedRequest(config.baseUrl, ep, { method: 'GET' }, config.requestTimeoutMs))
    );
    return results;
  });

  const nested = await Promise.all(userPromises);
  const samples = nested.flat();
  return computeScenarioSummary('1. Morning Boot Storm (11 APIs/user)', virtualUsers, samples, performance.now() - start);
};

export const runNotificationPollingWave = async (
  config: StressConfig,
  virtualUsers: number,
  userIds: string[]
): Promise<ScenarioSummary> => {
  const start = performance.now();
  const waves = 2;
  const allSamples: RequestSample[] = [];

  for (let w = 0; w < waves; w++) {
    const waveSamples = await Promise.all(
      Array.from({ length: virtualUsers }, (_, idx) => {
        const uid = userIds[idx % userIds.length];
        return timedRequest(
          config.baseUrl,
          `/api/users/${encodeURIComponent(uid)}/chat-notifications`,
          { method: 'GET', endpointLabel: '/api/users/:id/chat-notifications' },
          config.requestTimeoutMs
        );
      })
    );
    allSamples.push(...waveSamples);
  }

  return computeScenarioSummary('2. Notification Bell Polling (2 waves)', virtualUsers, allSamples, performance.now() - start);
};

export const runEveningTimesheetRush = async (
  config: StressConfig,
  virtualUsers: number,
  userIds: string[],
  runId: string,
  trackedIds: Set<string>
): Promise<ScenarioSummary> => {
  const ids = Array.from({ length: virtualUsers }, (_, idx) => `ts_stress_${runId}_${virtualUsers}_${idx}`);
  for (const id of ids) trackedIds.add(id);

  const start = performance.now();
  const writeSamples = await Promise.all(
    ids.map((id, idx) => {
      const uid = userIds[idx % userIds.length];
      return timedRequest(
        config.baseUrl,
        '/api/timesheets',
        {
          method: 'POST',
          endpointLabel: '/api/timesheets (POST)',
          body: {
            id,
            userId: uid,
            projectId: null,
            taskId: null,
            date: '2099-12-31',
            hours: 1,
            description: `[STRESS_TEST] Ephemeral VU #${idx}`,
            status: 'Approved',
            approvedBy: uid,
            isPersonal: true,
            isWfh: false,
          },
        },
        config.requestTimeoutMs
      );
    })
  );
  const wallDuration = performance.now() - start;

  await cleanupTimesheetIds(config.baseUrl, ids, trackedIds, config.requestTimeoutMs);

  return computeScenarioSummary('3. Evening Timesheet Write Rush', virtualUsers, writeSamples, wallDuration);
};

export const cleanupTimesheetIds = async (
  baseUrl: string,
  ids: string[],
  trackedIds: Set<string>,
  timeoutMs: number
): Promise<void> => {
  const batchSize = 25;
  for (let i = 0; i < ids.length; i += batchSize) {
    const slice = ids.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (id) => {
        const res = await timedRequest(
          baseUrl,
          `/api/timesheets/${encodeURIComponent(id)}`,
          { method: 'DELETE', endpointLabel: '/api/timesheets/:id' },
          timeoutMs
        );
        if (res.ok) trackedIds.delete(id);
      })
    );
  }
};
