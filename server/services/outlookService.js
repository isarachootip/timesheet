const MS_SCOPES = 'openid profile email offline_access Calendars.Read User.Read';

export function encodeOAuthState({ origin = '', userId = '', returnPath = '' } = {}) {
  const payload = JSON.stringify({
    nonce: Math.random().toString(36).substring(2, 10),
    origin,
    userId,
    returnPath,
  });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeOAuthState(stateStr) {
  if (!stateStr) return { origin: '', userId: '', returnPath: '' };
  try {
    const json = Buffer.from(stateStr, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    return {
      origin: parsed.origin || '',
      userId: parsed.userId || '',
      returnPath: parsed.returnPath || '',
    };
  } catch {
    return { origin: '', userId: '', returnPath: '' };
  }
}

export function buildMicrosoftAuthUrl({ clientId, tenantId = 'common', redirectUri, state, prompt = 'select_account' }) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: MS_SCOPES,
    state,
    prompt,
  });
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize?${params.toString()}`;
}

export function isTokenExpired(expiresAtMs, nowMs = Date.now()) {
  if (!expiresAtMs) return true;
  return Number(expiresAtMs) - nowMs <= 60_000;
}

export function cleanBodyPreview(rawPreview = '') {
  if (!rawPreview) return '';
  const withoutTeamsDivider = rawPreview.split(/_{10,}/)[0];
  return withoutTeamsDivider
    .replace(/Microsoft Teams Need help\?[\s\S]*$/i, '')
    .trim();
}

function extractDatePart(dateTimeStr = '') {
  if (!dateTimeStr) return new Date().toISOString().split('T')[0];
  return dateTimeStr.substring(0, 10);
}

function subtractOneDay(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().split('T')[0];
}

export function normalizeGraphEvent(graphEvent) {
  const isAllDay = Boolean(graphEvent.isAllDay);
  const startRaw = graphEvent.start?.dateTime || '';
  const endRaw = graphEvent.end?.dateTime || '';

  const startDate = extractDatePart(startRaw);
  let endDate = extractDatePart(endRaw) || startDate;

  let estimatedHours = 8;
  if (isAllDay) {
    estimatedHours = 8;
    if (endDate > startDate) {
      endDate = subtractOneDay(endDate);
    }
  } else {
    const startMs = new Date(startRaw).getTime();
    const endMs = new Date(endRaw).getTime();
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
      const diffHours = (endMs - startMs) / 3_600_000;
      const rounded = Math.round(diffHours * 100) / 100;
      estimatedHours = Math.max(0.5, rounded);
    } else {
      estimatedHours = 1;
    }
  }

  const isRecurring =
    graphEvent.type === 'occurrence' ||
    graphEvent.type === 'exception' ||
    Boolean(graphEvent.seriesMasterId);

  return {
    outlookEventId: String(graphEvent.id || ''),
    title: String(graphEvent.subject || '(No Subject)').trim(),
    description: cleanBodyPreview(graphEvent.bodyPreview || ''),
    startDate,
    endDate,
    startDateTime: startRaw,
    endDateTime: endRaw,
    estimatedHours,
    isAllDay,
    isRecurring,
    organizer: graphEvent.organizer?.emailAddress?.name || graphEvent.organizer?.emailAddress?.address || '',
  };
}

export async function exchangeMicrosoftCode({ code, clientId, clientSecret, tenantId = 'common', redirectUri }) {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: MS_SCOPES,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange Microsoft authorization code');
  }
  return data;
}

export async function refreshMicrosoftAccessToken({ refreshToken, clientId, clientSecret, tenantId = 'common' }) {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: MS_SCOPES,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Microsoft access token');
  }
  return data;
}

export async function fetchMicrosoftProfile(accessToken) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to fetch Microsoft profile');
  }
  return data;
}

export async function fetchCalendarView(accessToken, startDate, endDate) {
  const startIso = `${startDate}T00:00:00`;
  const endIso = `${endDate}T23:59:59`;
  const params = new URLSearchParams({
    startDateTime: startIso,
    endDateTime: endIso,
    $top: '100',
    $orderby: 'start/dateTime asc',
    $select: 'id,subject,bodyPreview,start,end,isAllDay,type,seriesMasterId,organizer,isCancelled',
  });

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="Asia/Bangkok"',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to fetch Outlook calendar events');
  }
  const items = Array.isArray(data.value) ? data.value : [];
  return items.filter(evt => !evt.isCancelled).map(normalizeGraphEvent);
}
