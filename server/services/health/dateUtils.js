export const DAY_MS = 86_400_000;

export const toUtcDayMs = (input) => {
  if (!input) return null;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const datePart = trimmed.split('T')[0];
    const parts = datePart.split('-').map(Number);
    if (parts.length === 3 && parts[0] > 1900 && parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
      return Date.UTC(parts[0], parts[1] - 1, parts[2]);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
    }
  }
  return null;
};

export const diffCalendarDays = (laterUtcMs, earlierUtcMs) =>
  Math.round((laterUtcMs - earlierUtcMs) / DAY_MS);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const round2 = (value) => Math.round(value * 100) / 100;
