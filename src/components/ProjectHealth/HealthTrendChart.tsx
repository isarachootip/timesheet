import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ProjectHealthHistoryPoint } from '../../types/projectHealth';
import { formatToDDMMYYYY } from '../../utils';

interface HealthTrendChartProps {
  history: ProjectHealthHistoryPoint[];
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ history }) => {
  const chartData = history
    .filter((pt) => pt.healthScore !== null)
    .map((pt) => ({
      dateLabel: formatToDDMMYYYY(pt.snapshotDate),
      score: pt.healthScore,
      status: pt.status,
    }));

  return (
    <section
      className="surface-card"
      data-testid="health-trend-section"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            แนวโน้มคะแนนสุขภาพโครงการ (Health Trend)
          </h3>
        </div>
        <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
          บันทึกย้อนหลัง {chartData.length} ครั้ง
        </span>
      </div>

      {chartData.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-13)',
          }}
        >
          ยังไม่มีข้อมูลคะแนนย้อนหลังสำหรับแสดงกราฟแนวโน้ม
        </div>
      ) : (
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                stroke="var(--border-color)"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                stroke="var(--border-color)"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={80} stroke="var(--dot-success)" strokeDasharray="4 4" />
              <ReferenceLine y={60} stroke="var(--dot-warning)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="score"
                name="Health Score"
                stroke="var(--accent-primary)"
                fill="var(--accent-subtle)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--accent-primary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
