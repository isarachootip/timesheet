export interface OAuthStatePayload {
  origin?: string;
  userId?: string;
  returnPath?: string;
}

export interface NormalizedOutlookEvent {
  outlookEventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startDateTime: string;
  endDateTime: string;
  estimatedHours: number;
  isAllDay: boolean;
  isRecurring: boolean;
  organizer: string;
}

export interface RawGraphEvent {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  isAllDay?: boolean;
  isCancelled?: boolean;
  type?: string;
  seriesMasterId?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  organizer?: { emailAddress?: { name?: string; address?: string } };
}

export function encodeOAuthState(payload?: OAuthStatePayload): string;
export function decodeOAuthState(stateStr?: string): Required<OAuthStatePayload>;
export function buildMicrosoftAuthUrl(params: {
  clientId: string;
  tenantId?: string;
  redirectUri: string;
  state: string;
  prompt?: string;
}): string;
export function isTokenExpired(expiresAtMs: number | null | undefined, nowMs?: number): boolean;
export function cleanBodyPreview(rawPreview?: string): string;
export function normalizeGraphEvent(graphEvent: RawGraphEvent): NormalizedOutlookEvent;
export function fetchCalendarView(accessToken: string, startDate: string, endDate: string): Promise<NormalizedOutlookEvent[]>;
