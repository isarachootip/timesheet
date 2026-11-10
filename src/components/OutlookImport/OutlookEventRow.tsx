import { Clock, Repeat, CheckCircle2, Sparkles } from 'lucide-react';
import type { OutlookCalendarEvent } from '../../types/outlook';
import { formatToDDMMYYYY } from '../../utils';

interface OutlookEventRowProps {
  event: OutlookCalendarEvent;
  selected: boolean;
  hours: number;
  projectName?: string;
  onToggleSelect: (id: string) => void;
  onChangeHours: (id: string, hours: number) => void;
}

function formatTimeRange(event: OutlookCalendarEvent): string {
  if (event.isAllDay) return 'All-Day Event';
  const s = event.startDateTime ? event.startDateTime.substring(11, 16) : '';
  const e = event.endDateTime ? event.endDateTime.substring(11, 16) : '';
  return s && e ? `${s} - ${e}` : s;
}

export const OutlookEventRow = ({
  event,
  selected,
  hours,
  projectName,
  onToggleSelect,
  onChangeHours,
}: OutlookEventRowProps) => {
  const isAlreadyImported = Boolean(event.existingTaskId);

  return (
    <div
      onClick={() => onToggleSelect(event.outlookEventId)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: selected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-tertiary)',
        border: selected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(event.outlookEventId)}
        onClick={e => e.stopPropagation()}
        style={{ marginTop: '0.25rem', width: '16px', height: '16px', cursor: 'pointer' }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            {event.title}
          </span>

          {isAlreadyImported ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 600,
              }}
              title={projectName ? `Imported in ${projectName} (Select to Sync Update)` : 'Select to Sync Update'}
            >
              <CheckCircle2 size={11} /> Imported {projectName ? `(${projectName})` : ''} • Sync Available
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                fontWeight: 600,
              }}
            >
              <Sparkles size={11} /> New
            </span>
          )}

          {event.isAllDay && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                fontWeight: 600,
              }}
            >
              All-Day
            </span>
          )}

          {event.isRecurring && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
              title="Recurring Calendar Event Occurrence"
            >
              <Repeat size={11} /> Recurring
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          <span>📅 {formatToDDMMYYYY(event.startDate)}{event.endDate !== event.startDate ? ` - ${formatToDDMMYYYY(event.endDate)}` : ''}</span>
          <span>⏰ {formatTimeRange(event)}</span>
          {event.organizer && <span>👤 {event.organizer}</span>}
        </div>

        {event.description && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: '0.3rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.description}
          </div>
        )}
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', minWidth: '88px' }}
      >
        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Clock size={11} /> Est. Hours
        </label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          max="240"
          value={hours}
          onChange={e => onChangeHours(event.outlookEventId, parseFloat(e.target.value) || 0)}
          style={{
            width: '76px',
            padding: '0.3rem 0.45rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'right',
          }}
        />
      </div>
    </div>
  );
};
