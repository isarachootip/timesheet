export interface MinimalRequest {
  headers?: Record<string, string | string[] | undefined>;
}

export interface MinimalResponse {
  getHeader: (name: string) => unknown;
  setHeader: (name: string, value: string) => unknown;
  json: (body: unknown) => unknown;
  send: (body: unknown) => unknown;
}

export function gzipJsonMiddleware(
  req: MinimalRequest,
  res: MinimalResponse,
  next: () => void
): void;
