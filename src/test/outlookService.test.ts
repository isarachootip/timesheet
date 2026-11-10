import { describe, it, expect } from 'vitest';
import {
  normalizeGraphEvent,
  isTokenExpired,
  buildMicrosoftAuthUrl,
  encodeOAuthState,
  decodeOAuthState,
} from '../../server/services/outlookService.js';

describe('outlookService Domain Logic', () => {
  describe('normalizeGraphEvent', () => {
    it('calculates estimatedHours from start and end time for timed events', () => {
      const rawEvent = {
        id: 'AAMkAGVmMDEzMTM4LTZmYWUtNDdkNC1hMDZiLTU1OGY5OTZhYmY4OABGAAAAAAAiQ8W967B7TKKjgx9r7T12BwAiIsqMbYjsT5e-T7KzowKTAAAAAAENAACiIsqMbYjsT5e-T7KzowKTAAAY8R1JAAA=',
        subject: 'Sprint Planning & Architecture Review',
        bodyPreview: 'Discuss Q4 backlog items and API contracts.\r\n________________________________________________________________________________\r\nMicrosoft Teams Need help?\r\nJoin the meeting now',
        isAllDay: false,
        type: 'singleInstance',
        start: { dateTime: '2026-11-10T09:30:00.0000000', timeZone: 'Asia/Bangkok' },
        end: { dateTime: '2026-11-10T11:00:00.0000000', timeZone: 'Asia/Bangkok' },
        organizer: { emailAddress: { name: 'PM Lead', address: 'pm@company.com' } },
      };

      const normalized = normalizeGraphEvent(rawEvent);

      expect(normalized.outlookEventId).toBe(rawEvent.id);
      expect(normalized.title).toBe('Sprint Planning & Architecture Review');
      expect(normalized.description).toBe('Discuss Q4 backlog items and API contracts.');
      expect(normalized.estimatedHours).toBe(1.5);
      expect(normalized.startDate).toBe('2026-11-10');
      expect(normalized.endDate).toBe('2026-11-10');
      expect(normalized.isAllDay).toBe(false);
      expect(normalized.isRecurring).toBe(false);
    });

    it('defaults estimatedHours to 8 for All-Day events and adjusts exclusive endDate', () => {
      const rawAllDay = {
        id: 'evt_allday_1',
        subject: 'Company Hackathon Day',
        bodyPreview: 'Annual internal innovation day',
        isAllDay: true,
        type: 'singleInstance',
        start: { dateTime: '2026-11-12T00:00:00.0000000', timeZone: 'Asia/Bangkok' },
        end: { dateTime: '2026-11-13T00:00:00.0000000', timeZone: 'Asia/Bangkok' },
      };

      const normalized = normalizeGraphEvent(rawAllDay);

      expect(normalized.isAllDay).toBe(true);
      expect(normalized.estimatedHours).toBe(8);
      expect(normalized.startDate).toBe('2026-11-12');
      expect(normalized.endDate).toBe('2026-11-12');
    });

    it('marks recurring occurrences and enforces minimum 0.5h for short meetings', () => {
      const rawRecurring = {
        id: 'evt_occ_20261110',
        seriesMasterId: 'evt_master_1',
        subject: 'Daily Standup',
        bodyPreview: 'Quick sync',
        isAllDay: false,
        type: 'occurrence',
        start: { dateTime: '2026-11-10T09:00:00.0000000', timeZone: 'Asia/Bangkok' },
        end: { dateTime: '2026-11-10T09:15:00.0000000', timeZone: 'Asia/Bangkok' },
      };

      const normalized = normalizeGraphEvent(rawRecurring);

      expect(normalized.isRecurring).toBe(true);
      expect(normalized.estimatedHours).toBe(0.5);
    });
  });

  describe('isTokenExpired', () => {
    it('returns true if expiresAt is missing or within 60s buffer', () => {
      const now = 1700000000000;
      expect(isTokenExpired(null, now)).toBe(true);
      expect(isTokenExpired(now + 30000, now)).toBe(true);
      expect(isTokenExpired(now + 120000, now)).toBe(false);
    });
  });

  describe('OAuth State & Authorize URL', () => {
    it('encodes and decodes origin, userId, and returnPath accurately', () => {
      const state = encodeOAuthState({
        origin: 'http://localhost:5173',
        userId: 'u1',
        returnPath: '/tasks',
      });
      const decoded = decodeOAuthState(state);

      expect(decoded.origin).toBe('http://localhost:5173');
      expect(decoded.userId).toBe('u1');
      expect(decoded.returnPath).toBe('/tasks');
    });

    it('builds Microsoft OAuth URL with required Graph scopes', () => {
      const url = buildMicrosoftAuthUrl({
        clientId: 'test-client-id',
        tenantId: 'common',
        redirectUri: 'http://localhost:3000/api/auth/microsoft/callback',
        state: 'state_xyz',
      });

      expect(url).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('Calendars.Read');
      expect(url).toContain('offline_access');
    });
  });
});
