import React from 'react';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';
import type { AiHealthAnalysis } from '../../types/projectHealth';
import { StatusBadge } from '../ui/StatusBadge';
import { formatHealthTimestamp } from './healthUiUtils';

interface HealthAiAnalysisCardProps {
  aiAnalysis: AiHealthAnalysis | null;
  aiAnalyzedAt: string | null;
  aiError?: string | null;
  isAnalyzing: boolean;
  canAnalyze: boolean;
  onAnalyze: () => void;
}

const getPriorityTone = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
  if (priority === 'HIGH') return 'danger' as const;
  if (priority === 'MEDIUM') return 'warning' as const;
  return 'neutral' as const;
};

const subPanelStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
};

export const HealthAiAnalysisCard: React.FC<HealthAiAnalysisCardProps> = ({
  aiAnalysis,
  aiAnalyzedAt,
  aiError,
  isAnalyzing,
  canAnalyze,
  onAnalyze,
}) => {
  return (
    <section
      className="surface-card"
      data-testid="health-ai-card"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              บทวิเคราะห์และข้อเสนอแนะจาก AI
            </h3>
          </div>
          {aiAnalyzedAt && (
            <span
              data-testid="ai-analyzed-at"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}
            >
              <Clock size={12} />
              วิเคราะห์ล่าสุดเมื่อ: {formatHealthTimestamp(aiAnalyzedAt)}
            </span>
          )}
        </div>

        <button
          type="button"
          data-testid="btn-analyze-ai"
          disabled={!canAnalyze || isAnalyzing}
          onClick={onAnalyze}
          title={canAnalyze ? 'คำนวณคะแนนใหม่และให้ AI วิเคราะห์' : 'เฉพาะ Admin, Manager หรือ PM ของโครงการเท่านั้น'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: canAnalyze ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: canAnalyze ? 'var(--accent-contrast)' : 'var(--text-muted)',
            fontSize: 'var(--fs-13)',
            fontWeight: 600,
            cursor: !canAnalyze || isAnalyzing ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing ? 0.75 : 1,
          }}
        >
          <Sparkles size={15} />
          {isAnalyzing ? 'กำลังวิเคราะห์ด้วย AI...' : 'วิเคราะห์ด้วย AI'}
        </button>
      </div>

      {aiError && (
        <div
          data-testid="ai-error-banner"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-danger-subtle)',
            border: '1px solid var(--accent-danger)',
            color: 'var(--accent-danger)',
            fontSize: 'var(--fs-13)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} />
          <span>ไม่สามารถดึงผลวิเคราะห์จาก AI ได้ชั่วคราว ({aiError}) แต่คะแนนจาก Health Engine อัปเดตล่าสุดแล้ว</span>
        </div>
      )}

      {!aiAnalysis ? (
        <div style={{ ...subPanelStyle, padding: '24px 16px', color: 'var(--text-secondary)', fontSize: 'var(--fs-13)', textAlign: 'center' }}>
          ยังไม่มีผลวิเคราะห์จาก AI สำหรับโครงการนี้ กดปุ่ม &ldquo;วิเคราะห์ด้วย AI&rdquo; เพื่อให้ระบบสรุปสาเหตุและข้อเสนอแนะ
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={subPanelStyle}>
            <div style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              สรุปภาพรวม (Summary)
            </div>
            <p style={{ margin: 0, fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {aiAnalysis.summary}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={subPanelStyle}>
              <div style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                สาเหตุหลัก / ความเสี่ยง (Root Causes)
              </div>
              {aiAnalysis.root_causes.length === 0 ? (
                <p style={{ margin: 0, fontSize: 'var(--fs-13)', color: 'var(--text-muted)' }}>ไม่พบสาเหตุความเสี่ยงเร่งด่วน</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aiAnalysis.root_causes.map((cause, idx) => (
                    <li key={idx} style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {cause}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ ...subPanelStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)' }}>
                ข้อเสนอแนะเชิงปฏิบัติ (Recommendations)
              </div>
              {aiAnalysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge label={rec.priority} tone={getPriorityTone(rec.priority)} emphasizeDanger={rec.priority === 'HIGH'} />
                    <span style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)' }}>{rec.action}</span>
                  </div>
                  <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>ผลที่คาดหวัง: {rec.expected_impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
