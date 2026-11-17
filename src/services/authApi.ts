import { z } from 'zod';
import type { User } from '../types';

export const authenticatedUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string(),
  globalRole: z.enum(['Admin', 'Manager', 'Employee', 'User']),
  department: z.string(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
  birthday: z.string().optional(),
  skills: z.array(z.string()).optional(),
  wfhDays: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const loginRequestSchema = z.object({
  email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง / Invalid email format'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน / Password is required'),
});

export interface LoginRequestOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_LOGIN_TIMEOUT_MS = 15_000;

export const loginWithPassword = async (
  email: string,
  password: string,
  options: LoginRequestOptions = {}
): Promise<User> => {
  const parsedInput = loginRequestSchema.safeParse({ email, password });
  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message || 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedInput.data),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        'หมดเวลาเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง / Login request timed out'
      );
    }
    throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ / Connection error');
  } finally {
    globalThis.clearTimeout(timer);
  }

  const rawBody = await response.text();
  let parsedJson: unknown = null;
  if (rawBody) {
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      parsedJson = null;
    }
  }

  if (!response.ok) {
    if (
      parsedJson &&
      typeof parsedJson === 'object' &&
      'error' in parsedJson &&
      typeof (parsedJson as { error?: unknown }).error === 'string'
    ) {
      throw new Error((parsedJson as { error: string }).error);
    }
    if (response.status >= 502 && response.status <= 504) {
      throw new Error(
        `เซิร์ฟเวอร์ไม่ตอบสนองชั่วคราว (${response.status} Gateway Error) กรุณารอสักครู่แล้วลองใหม่`
      );
    }
    throw new Error(`การเข้าสู่ระบบล้มเหลว (${response.status}) / Login failed`);
  }

  const validated = authenticatedUserSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error('ข้อมูลตอบกลับจากเซิร์ฟเวอร์ไม่สมบูรณ์ / Invalid server login response');
  }

  return validated.data;
};
