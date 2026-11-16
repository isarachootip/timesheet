import { parseStressConfig } from './stressConfig';
import { fetchSampleUserIds, timedRequest } from './stressHttpClient';
import { formatMarkdownReport, type ScenarioSummary } from './stressMetrics';
import {
  cleanupTimesheetIds,
  runEveningTimesheetRush,
  runMorningBootStorm,
  runNotificationPollingWave,
} from './stressScenarios';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const verifyZeroLeftoverRows = async (baseUrl: string, runId: string): Promise<number> => {
  const res = await fetch(`${baseUrl}/api/timesheets`);
  if (!res.ok) return -1;
  const rows: unknown = await res.json();
  if (!Array.isArray(rows)) return -1;
  return rows.filter(
    (r): r is Record<string, unknown> =>
      typeof r === 'object' &&
      r !== null &&
      typeof r.id === 'string' &&
      r.id.startsWith(`ts_stress_${runId}`)
  ).length;
};

async function main() {
  const config = parseStressConfig(process.env);
  const runId = Date.now().toString(36);
  const trackedIds = new Set<string>();
  const summaries: ScenarioSummary[] = [];

  console.log(`\n🚀 Starting Stress Test against: ${config.baseUrl}`);
  console.log(`   Tiers: [${config.concurrencyTiers.join(', ')}] VUs | Timeout: ${config.requestTimeoutMs}ms\n`);

  const preHealth = await timedRequest(config.baseUrl, '/api/health', { method: 'GET' }, 10000);
  if (!preHealth.ok) {
    throw new Error(`Target ${config.baseUrl}/api/health is unreachable (status=${preHealth.status}, err=${preHealth.error})`);
  }
  console.log(`✅ Pre-flight /api/health OK (${Math.round(preHealth.durationMs)}ms)`);

  const userIds = await fetchSampleUserIds(config.baseUrl);

  try {
    for (const vus of config.concurrencyTiers) {
      console.log(`▶ Running Scenario 1 (Morning Boot Storm) @ ${vus} VUs (${vus * 11} requests)...`);
      const s1 = await runMorningBootStorm(config, vus);
      summaries.push(s1);
      console.log(`  ↳ RPS=${s1.rps} | p50=${s1.p50Ms}ms | p95=${s1.p95Ms}ms | p99=${s1.p99Ms}ms | Data=${s1.totalMegabytes}MB | Err=${s1.errorRatePct}%`);
      await pause(1200);
      if (s1.errorRatePct >= config.circuitBreakerErrorPct) {
        console.warn(`⚠️ Circuit breaker tripped on Scenario 1 (${s1.errorRatePct}% errors). Stopping higher Boot Storm tiers.`);
        break;
      }
    }

    for (const vus of config.concurrencyTiers) {
      console.log(`▶ Running Scenario 2 (Notification Polling) @ ${vus} VUs (${vus * 2} requests)...`);
      const s2 = await runNotificationPollingWave(config, vus, userIds);
      summaries.push(s2);
      console.log(`  ↳ RPS=${s2.rps} | p50=${s2.p50Ms}ms | p95=${s2.p95Ms}ms | p99=${s2.p99Ms}ms | Err=${s2.errorRatePct}%`);
      await pause(800);
      if (s2.errorRatePct >= config.circuitBreakerErrorPct) break;
    }

    if (config.enableSafeEphemeralWrites) {
      for (const vus of config.concurrencyTiers) {
        console.log(`▶ Running Scenario 3 (Evening Timesheet Write Rush) @ ${vus} VUs...`);
        const s3 = await runEveningTimesheetRush(config, vus, userIds, runId, trackedIds);
        summaries.push(s3);
        console.log(`  ↳ RPS=${s3.rps} | p50=${s3.p50Ms}ms | p95=${s3.p95Ms}ms | p99=${s3.p99Ms}ms | Err=${s3.errorRatePct}%`);
        await pause(800);
        if (s3.errorRatePct >= config.circuitBreakerErrorPct) break;
      }
    }
  } finally {
    if (trackedIds.size > 0) {
      console.log(`🧹 Cleaning up ${trackedIds.size} remaining ephemeral timesheet rows...`);
      await cleanupTimesheetIds(config.baseUrl, Array.from(trackedIds), trackedIds, config.requestTimeoutMs);
    }
  }

  const leftover = await verifyZeroLeftoverRows(config.baseUrl, runId);
  const postHealth = await timedRequest(config.baseUrl, '/api/health', { method: 'GET' }, 10000);
  console.log(`\n✅ Post-flight /api/health: status=${postHealth.status} (${Math.round(postHealth.durationMs)}ms) | Leftover stress rows=${leftover}\n`);

  console.log(formatMarkdownReport(config.baseUrl, summaries));

  const worstBoot = summaries.filter((s) => s.scenarioName.startsWith('1.')).pop();
  if (worstBoot) {
    console.log('\n--- Slowest Endpoints Breakdown (Peak Boot Storm) ---');
    for (const ep of worstBoot.endpointBreakdown.slice(0, 6)) {
      console.log(
        `  ${ep.endpoint.padEnd(32)} | avg=${ep.avgMs}ms | p95=${ep.p95Ms}ms | payload=${ep.avgKilobytes}KB | errs=${ep.errorCount}`
      );
    }
  }
}

main().catch((err) => {
  console.error('❌ Stress suite failed:', err);
  process.exit(1);
});
