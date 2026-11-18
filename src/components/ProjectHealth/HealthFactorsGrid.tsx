import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type {
  HealthConfidence,
  HealthDataIssue,
  HealthFactorScores,
  HealthStatus,
} from '../../types/projectHealth';
import {
  formatFactorDetailHint,
  getConfidenceLabel,
  getScoreBarColor,
  HEALTH_FACTOR_META,
} from './healthUiUtils';

interface HealthFactorsGridProps {
  status: HealthStatus;
  confidence: HealthConfidence;
  factors: HealthFactorScores;
  factorDetails: Record<string, Record<string, unknown>>;
  dataIssues: HealthDataIssue[];
}

export const HealthFactorsGrid: React.FC<HealthFactorsGridProps> = ({
  status,
  confidence,
  factors,
  factorDetails,
  dataIssues,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        className="surface-card"
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            คะแนนรายปัจจัย (Health Factors)
          </h3>
          <span
            data-testid="health-confidence-badge"
            style={{
              fontSize: 'var(--fs-12)',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color:
                confidence === 'HIGH'
                  ? 'var(--accent-success)'
                  : confidence === 'MEDIUM'
                    ? 'var(--accent-warning)'
                    : 'var(--accent-danger)',
            }}
          >
            {getConfidenceLabel(confidence)}
          </span>
        </div>

        {status === 'COMPLETED' ? (
          <p style={{ margin: 0, fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
            โครงการนี้เสร็จสมบูรณ์แล้ว (สถานะ Completed หรือความคืบหน้าครบ 100%) จึงไม่ต้องคำนวณคะแนนรายปัจจัย
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {HEALTH_FACTOR_META.filter(
              (meta) => !meta.optionalWhenNull || (factors[meta.key] !== null && factors[meta.key] !== undefined)
            ).map((meta) => {
              const score = factors[meta.key] ?? null;
              const hint = formatFactorDetailHint(meta.key, factorDetails[meta.key]);
              return (
                <div
                  key={meta.key}
                  data-testid={`factor-card-${meta.key}`}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div className="flex-between">
                    <span style={{ fontSize: 'var(--fs-14)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--fs-12)',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      น้ำหนัก {meta.weightLabel}
                    </span>
                  </div>

                  <div className="tabular-nums" style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {score !== null ? `${score}` : 'N/A'}
                    {score !== null && (
                      <span style={{ fontSize: 'var(--fs-12)', fontWeight: 400, color: 'var(--text-muted)' }}> / 100</span>
                    )}
                  </div>

                  <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${score !== null ? Math.min(100, Math.max(0, score)) : 0}%`,
                        backgroundColor: getScoreBarColor(score),
                        borderRadius: 'var(--radius-full)',
                        transition: 'width var(--transition-normal)',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {hint || meta.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dataIssues.length > 0 && (
        <div
          className="surface-card"
          data-testid="health-data-issues"
          style={{
            padding: '16px 20px',
            borderLeft: '3px solid var(--accent-warning)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)', fontWeight: 600, fontSize: 'var(--fs-14)' }}>
            <ShieldAlert size={16} />
            <span>ข้อสังเกตความสมบูรณ์ของข้อมูล ({dataIssues.length} รายการ)</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {dataIssues.map((issue) => (
              <li key={issue.code} style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)' }}>
                {issue.message}{' '}
                <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
                  (กระทบ: {issue.affectedFactors.join(', ')})
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
            <AlertTriangle size={13} />
            <span>ระบบปรับสัดส่วนน้ำหนักอัตโนมัติจากปัจจัยที่มีข้อมูลครบถ้วน</span>
          </div>
        </div>
      )}
    </div>
  );
};
