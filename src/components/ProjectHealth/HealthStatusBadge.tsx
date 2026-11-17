import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { HealthStatus, HealthTrendDirection } from '../../types/projectHealth';
import { getHealthStatusStyle } from './healthUiUtils';

interface HealthStatusBadgeProps {
  status: HealthStatus;
  score: number | null;
  trend?: HealthTrendDirection;
  scoreDelta?: number | null;
  size?: 'sm' | 'md';
}

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({
  status,
  score,
  trend = 'NONE',
  scoreDelta = null,
  size = 'sm',
}) => {
  const style = getHealthStatusStyle(status);
  const isCompleted = status === 'COMPLETED';
  const deltaTitle =
    scoreDelta !== null && scoreDelta !== undefined
      ? `เปลี่ยนแปลงจากครั้งก่อน ${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} คะแนน`
      : 'แนวโน้มเทียบกับ Snapshot ก่อนหน้า';

  return (
    <div
      data-testid="health-status-cell"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'nowrap',
      }}
    >
      <span
        data-testid={`health-badge-${status.toLowerCase()}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'md' ? '4px 10px' : '3px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: style.bgColor,
          border: `1px solid ${style.borderColor}`,
          color: style.textColor,
          fontSize: size === 'md' ? 'var(--fs-13)' : 'var(--fs-12)',
          fontWeight: 600,
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: style.dotColor,
            flexShrink: 0,
          }}
        />
        {style.label}
      </span>

      {!isCompleted && score !== null && (
        <span
          className="tabular-nums"
          data-testid="health-score-value"
          style={{
            fontSize: size === 'md' ? 'var(--fs-16)' : 'var(--fs-13)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {score}
          <span style={{ fontSize: 'var(--fs-12)', fontWeight: 400, color: 'var(--text-muted)' }}>
            /100
          </span>
        </span>
      )}

      {!isCompleted && trend !== 'NONE' && (
        <span
          data-testid={`health-trend-${trend.toLowerCase()}`}
          title={deltaTitle}
          aria-label={`Trend ${trend}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: 'var(--fs-12)',
            fontWeight: 600,
            color:
              trend === 'UP'
                ? 'var(--accent-success)'
                : trend === 'DOWN'
                  ? 'var(--accent-danger)'
                  : 'var(--text-muted)',
          }}
        >
          {trend === 'UP' && <ArrowUpRight size={15} />}
          {trend === 'DOWN' && <ArrowDownRight size={15} />}
          {trend === 'FLAT' && <Minus size={14} />}
        </span>
      )}
    </div>
  );
};
