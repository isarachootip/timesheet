import { z } from 'zod';

export const stressConfigSchema = z.object({
  baseUrl: z
    .string()
    .url('baseUrl must be a valid HTTP/HTTPS URL')
    .transform((u) => u.replace(/\/+$/, '')),
  concurrencyTiers: z
    .array(z.number().int().min(1).max(1000))
    .min(1),
  requestTimeoutMs: z.number().int().min(1000).max(60000),
  enableSafeEphemeralWrites: z.boolean(),
  circuitBreakerErrorPct: z.number().min(5).max(100),
});

export type StressConfig = z.infer<typeof stressConfigSchema>;

export const parseStressConfig = (env: NodeJS.ProcessEnv = process.env): StressConfig => {
  const rawUrl = env.STRESS_TARGET_URL || 'https://prod.vibeproject.online';
  const rawTiers = env.STRESS_TIERS
    ? env.STRESS_TIERS.split(',').map((n) => Number(n.trim()))
    : [50, 100, 200];
  const rawTimeout = env.STRESS_TIMEOUT_MS ? Number(env.STRESS_TIMEOUT_MS) : 20000;
  const enableWrites = env.STRESS_ENABLE_WRITES !== 'false';
  const breakerPct = env.STRESS_BREAKER_PCT ? Number(env.STRESS_BREAKER_PCT) : 35;

  return stressConfigSchema.parse({
    baseUrl: rawUrl,
    concurrencyTiers: rawTiers,
    requestTimeoutMs: rawTimeout,
    enableSafeEphemeralWrites: enableWrites,
    circuitBreakerErrorPct: breakerPct,
  });
};
