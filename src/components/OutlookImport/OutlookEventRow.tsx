import { Calendar, Clock, Repeat, User as UserIcon } from 'lucide-react';
import type { OutlookCalendarEvent } from '../../types/outlook';
import { formatToDDMMYYYY } from '../../utils';
import { StatusBadge } from '../ui/StatusBadge';

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
        gap: '12px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
        border: selected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'background-color var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(event.outlookEventId)}
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
            {event.title}
          </span>

          {isAlreadyImported ? (
            <StatusBadge
              label={`Imported${projectName ? ` (${projectName})` : ''} · Sync Available`}
              tone="success"
            />
          ) : (
            <StatusBadge label="New" tone="accent" />
          )}

          {event.isAllDay && <StatusBadge label="All-Day" tone="warning" />}

          {event.isRecurring && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--fs-12)',
                color: 'var(--text-muted)',
              }}
              title="Recurring Calendar Event Occurrence"
            >
              <Repeat size={12} /> Recurring
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
            marginTop: '4px',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {formatToDDMMYYYY(event.startDate)}
            {event.endDate !== event.startDate ? ` - ${formatToDDMMYYYY(event.endDate)}` : ''}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {formatTimeRange(event)}
          </span>
          {event.organizer && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <UserIcon size={12} />
              {event.organizer}
            </span>
          )}
        </div>

        {event.description && (
          <div
            style={{
              fontSize: 'var(--fs-12)',
              color: 'var(--text-muted)',
              marginTop: '4px',
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
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: '88px' }}
      >
        <label style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> Est. Hours
        </label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          max="240"
          value={hours}
          onChange={(e) => onChangeHours(event.outlookEventId, parseFloat(e.target.value) || 0)}
          style={{
            width: '76px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--fs-13)',
            fontWeight: 600,
            textAlign: 'right',
          }}
        />
      </div>
    </div>
  );
};
