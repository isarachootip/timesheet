import { describe, expect, it, vi } from 'vitest';
import { loginWithPassword } from '../authApi';
import { resolveBootstrapQueryFlags } from '../../utils/bootstrapQueryFlags';

describe('loginWithPassword & Pre-Login Query Gating', () => {
  it('disables all 11 workspace queries on production login screen and enables them once authenticated', () => {
    const prodAnon = resolveBootstrapQueryFlags(null, 'vibeproject.online');
    expect(prodAnon).toEqual({
      enableUsersQuery: false,
      enableWorkspaceQueries: false,
    });

    const localAnon = resolveBootstrapQueryFlags(null, 'localhost');
    expect(localAnon).toEqual({
      enableUsersQuery: true,
      enableWorkspaceQueries: false,
    });

    const prodAuthed = resolveBootstrapQueryFlags(
      {
        id: 'u_admin',
        name: 'isarachootip',
        email: 'isarachootip@gmail.com',
        avatar: 'https://i.pravatar.cc/150?u=u_admin',
        globalRole: 'Admin',
        department: 'Management',
      },
      'vibeproject.online'
    );
    expect(prodAuthed).toEqual({
      enableUsersQuery: true,
      enableWorkspaceQueries: true,
    });
  });

  it('parses valid authenticated User payload with schema validation', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: 'u_admin',
          name: 'isarachootip',
          email: 'isarachootip@gmail.com',
          avatar: 'https://i.pravatar.cc/150?u=u_admin',
          globalRole: 'Admin',
          department: 'Management',
          skills: [],
          isActive: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = await loginWithPassword('isarachootip@gmail.com', 'secret', {
      fetchImpl,
      timeoutMs: 5000,
    });

    expect(user.id).toBe('u_admin');
    expect(user.email).toBe('isarachootip@gmail.com');
  });

  it('handles non-JSON 504 Gateway Timeout HTML responses without JSON SyntaxError', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('<html><body>504 Gateway Time-out</body></html>', {
        status: 504,
        headers: { 'Content-Type': 'text/html' },
      })
    );

    await expect(
      loginWithPassword('isarachootip@gmail.com', 'secret', {
        fetchImpl,
        timeoutMs: 5000,
      })
    ).rejects.toThrow(/เซิร์ฟเวอร์ไม่ตอบสนองชั่วคราว|Gateway|504/);
  });

  it('aborts hung login requests after timeoutMs instead of spinning forever', async () => {
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        })
    );

    await expect(
      loginWithPassword('isarachootip@gmail.com', 'secret', {
        fetchImpl,
        timeoutMs: 30,
      })
    ).rejects.toThrow(/หมดเวลาเชื่อมต่อเซิร์ฟเวอร์|timed out/i);
  });
});
