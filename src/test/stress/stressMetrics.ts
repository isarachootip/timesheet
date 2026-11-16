export interface RequestSample {
  endpoint: string;
  method: string;
  status: number;
  durationMs: number;
  bytes: number;
  ok: boolean;
  error?: string;
}

export interface EndpointBreakdown {
  endpoint: string;
  count: number;
  avgMs: number;
  p95Ms: number;
  avgKilobytes: number;
  errorCount: number;
}

export interface ScenarioSummary {
  scenarioName: string;
  virtualUsers: number;
  wallDurationMs: number;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  errorRatePct: number;
  rps: number;
  totalMegabytes: number;
  mbPerSec: number;
  minMs: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  statusCounts: Record<string, number>;
  endpointBreakdown: EndpointBreakdown[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const percentile = (sortedAsc: number[], pct: number): number => {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil((pct / 100) * sortedAsc.length) - 1));
  return round2(sortedAsc[idx]);
};

export const computeScenarioSummary = (
  scenarioName: string,
  virtualUsers: number,
  samples: RequestSample[],
  wallDurationMs: number
): ScenarioSummary => {
  const safeDurationSec = Math.max(0.001, wallDurationMs / 1000);
  const totalRequests = samples.length;
  const successCount = samples.filter((s) => s.ok).length;
  const errorCount = totalRequests - successCount;
  const errorRatePct = totalRequests > 0 ? round2((errorCount / totalRequests) * 100) : 0;

  const durations = samples.map((s) => s.durationMs).sort((a, b) => a - b);
  const totalBytes = samples.reduce((sum, s) => sum + s.bytes, 0);
  const totalMegabytes = round2(totalBytes / (1024 * 1024));

  const statusCounts: Record<string, number> = {};
  const byEndpoint = new Map<string, RequestSample[]>();

  for (const s of samples) {
    const key = s.status > 0 ? String(s.status) : s.error || 'ERR';
    statusCounts[key] = (statusCounts[key] || 0) + 1;
    const label = `${s.method} ${s.endpoint}`;
    const list = byEndpoint.get(label) || [];
    list.push(s);
    byEndpoint.set(label, list);
  }

  const endpointBreakdown: EndpointBreakdown[] = Array.from(byEndpoint.entries())
    .map(([endpoint, list]) => {
      const sorted = list.map((x) => x.durationMs).sort((a, b) => a - b);
      const avg = list.reduce((sum, x) => sum + x.durationMs, 0) / list.length;
      const avgKb = list.reduce((sum, x) => sum + x.bytes, 0) / list.length / 1024;
      return {
        endpoint,
        count: list.length,
        avgMs: round2(avg),
        p95Ms: percentile(sorted, 95),
        avgKilobytes: round2(avgKb),
        errorCount: list.filter((x) => !x.ok).length,
      };
    })
    .sort((a, b) => b.p95Ms - a.p95Ms);

  const avgMs = totalRequests > 0 ? round2(durations.reduce((a, b) => a + b, 0) / totalRequests) : 0;

  return {
    scenarioName,
    virtualUsers,
    wallDurationMs: round2(wallDurationMs),
    totalRequests,
    successCount,
    errorCount,
    errorRatePct,
    rps: round2(totalRequests / safeDurationSec),
    totalMegabytes,
    mbPerSec: round2(totalMegabytes / safeDurationSec),
    minMs: durations[0] ? round2(durations[0]) : 0,
    avgMs,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    maxMs: durations.length > 0 ? round2(durations[durations.length - 1]) : 0,
    statusCounts,
    endpointBreakdown,
  };
};

export const formatMarkdownReport = (baseUrl: string, summaries: ScenarioSummary[]): string => {
  const lines: string[] = [
    `# Stress Test Report — \`${baseUrl}\``,
    '',
    '| Scenario | VUs | Requests | RPS | Data (MB) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Error Rate |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];

  for (const s of summaries) {
    lines.push(
      `| ${s.scenarioName} | ${s.virtualUsers} | ${s.totalRequests} | ${s.rps} | ${s.totalMegabytes} | ${s.p50Ms} | ${s.p95Ms} | ${s.p99Ms} | ${s.maxMs} | ${s.errorRatePct.toFixed(1)}% |`
    );
  }
  return lines.join('\n');
};
