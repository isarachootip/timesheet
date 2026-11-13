import React from 'react';

export type DotTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface StatusBadgeProps {
  label: string;
  tone?: DotTone;
  emphasizeDanger?: boolean;
}

const DOT_COLOR_BY_TONE: Record<DotTone, string> = {
  neutral: 'var(--dot-neutral)',
  accent: 'var(--accent-primary)',
  success: 'var(--dot-success)',
  warning: 'var(--dot-warning)',
  danger: 'var(--dot-danger)',
};

export const getStatusTone = (status: string): DotTone => {
  const s = status.toLowerCase();
  if (s === 'done' || s === 'completed' || s === 'approved' || s === 'active') return 'success';
  if (s === 'in progress') return 'accent';
  if (s === 'review' || s === 'on hold' || s === 'pending') return 'warning';
  if (s === 'rejected') return 'danger';
  return 'neutral';
};

export const getPriorityTone = (priority: string, isCritical = false): DotTone => {
  if (isCritical || priority === 'Urgent') return 'danger';
  if (priority === 'High') return 'warning';
  if (priority === 'Medium') return 'accent';
  return 'neutral';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
  emphasizeDanger = false,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 8px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: emphasizeDanger ? 'var(--accent-danger-subtle)' : 'var(--bg-tertiary)',
      border: `1px solid ${emphasizeDanger ? 'var(--accent-danger)' : 'var(--border-color)'}`,
      color: emphasizeDanger ? 'var(--accent-danger)' : 'var(--text-secondary)',
      fontSize: 'var(--fs-12)',
      fontWeight: 500,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
    }}
  >
    <span
      aria-hidden="true"
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: DOT_COLOR_BY_TONE[tone],
        flexShrink: 0,
      }}
    />
    {label}
  </span>
);
