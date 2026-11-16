import { describe, it, expect } from 'vitest';
import {
  computeScenarioSummary,
  formatMarkdownReport,
  type RequestSample,
} from '../stressMetrics';

describe('stressMetrics', () => {
  it('computes accurate latency percentiles, RPS, throughput MB/s, and error rates', () => {
    const samples: RequestSample[] = [
      { endpoint: '/api/tasks', method: 'GET', status: 200, durationMs: 100, bytes: 1024 * 100, ok: true },
      { endpoint: '/api/tasks', method: 'GET', status: 200, durationMs: 200, bytes: 1024 * 100, ok: true },
      { endpoint: '/api/tasks', method: 'GET', status: 200, durationMs: 300, bytes: 1024 * 100, ok: true },
      { endpoint: '/api/tasks', method: 'GET', status: 200, durationMs: 400, bytes: 1024 * 100, ok: true },
      { endpoint: '/api/tasks', method: 'GET', status: 503, durationMs: 1000, bytes: 512, ok: false, error: 'HTTP 503' },
    ];

    const summary = computeScenarioSummary('Morning Boot Storm', 50, samples, 2000);

    expect(summary.totalRequests).toBe(5);
    expect(summary.successCount).toBe(4);
    expect(summary.errorCount).toBe(1);
    expect(summary.errorRatePct).toBe(20);
    expect(summary.rps).toBe(2.5);
    expect(summary.minMs).toBe(100);
    expect(summary.p50Ms).toBe(300);
    expect(summary.p95Ms).toBe(1000);
    expect(summary.maxMs).toBe(1000);
    expect(summary.totalMegabytes).toBeGreaterThan(0.38);

    const md = formatMarkdownReport('https://prod.vibeproject.online', [summary]);
    expect(md).toContain('Morning Boot Storm');
    expect(md).toContain('20.0%');
  });
});
