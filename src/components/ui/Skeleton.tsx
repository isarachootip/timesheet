import React from 'react';

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = '16px',
  style,
}) => (
  <div
    className="skeleton-block"
    style={{
      width,
      height,
      ...style,
    }}
  />
);

export const DashboardSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} aria-label="Loading workspace">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <SkeletonBox width="260px" height="28px" />
      <SkeletonBox width="160px" height="14px" />
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '12px',
      }}
    >
      {[1, 2, 3, 4].map((idx) => (
        <div key={idx} className="surface-card" style={{ padding: '12px 16px', height: '72px' }}>
          <SkeletonBox width="90px" height="12px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="48px" height="20px" />
        </div>
      ))}
    </div>
    <div className="surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SkeletonBox width="140px" height="18px" />
      {[1, 2, 3, 4].map((row) => (
        <SkeletonBox key={row} height="48px" />
      ))}
    </div>
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Loading view">
    <SkeletonBox width="220px" height="24px" />
    <div className="surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3, 4, 5].map((idx) => (
        <SkeletonBox key={idx} height="40px" />
      ))}
    </div>
  </div>
);
