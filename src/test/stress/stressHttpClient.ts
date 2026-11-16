import type { RequestSample } from './stressMetrics';

export interface TimedRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  endpointLabel?: string;
}

export const timedRequest = async (
  baseUrl: string,
  path: string,
  options: TimedRequestOptions = {},
  timeoutMs = 20000
): Promise<RequestSample> => {
  const method = options.method || 'GET';
  const endpointLabel = options.endpointLabel || path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const buf = await res.arrayBuffer();
    const durationMs = performance.now() - start;
    return {
      endpoint: endpointLabel,
      method,
      status: res.status,
      durationMs,
      bytes: buf.byteLength,
      ok: res.status >= 200 && res.status < 400,
      error: res.ok ? undefined : `HTTP_${res.status}`,
    };
  } catch (err) {
    const durationMs = performance.now() - start;
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      endpoint: endpointLabel,
      method,
      status: 0,
      durationMs,
      bytes: 0,
      ok: false,
      error: isAbort ? 'TIMEOUT' : err instanceof Error ? err.name || 'NET_ERR' : 'NET_ERR',
    };
  } finally {
    clearTimeout(timer);
  }
};

export const fetchSampleUserIds = async (baseUrl: string): Promise<string[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/users`);
    if (!res.ok) return ['u1'];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return ['u1'];
    const ids = data
      .filter((u): u is Record<string, unknown> => typeof u === 'object' && u !== null)
      .map((u) => (typeof u.id === 'string' ? u.id : ''))
      .filter(Boolean);
    return ids.length > 0 ? ids : ['u1'];
  } catch {
    return ['u1'];
  }
};
