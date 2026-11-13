import React from 'react';
import { Clock } from 'lucide-react';

interface ChronoTrackLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface ChronoTrackBrandProps {
  size?: 'sm' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const ChronoTrackLogo: React.FC<ChronoTrackLogoProps> = ({
  size = 32,
  className,
  style,
}) => (
  <div
    aria-label="ChronoTrack Logo"
    className={className}
    style={{
      width: size,
      height: size,
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--accent-subtle)',
      border: '1px solid var(--border-color)',
      color: 'var(--accent-primary)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}
  >
    <Clock size={Math.round(size * 0.56)} strokeWidth={2.2} />
  </div>
);

export const ChronoTrackBrand: React.FC<ChronoTrackBrandProps> = ({
  size = 'sm',
  className,
  style,
}) => {
  const isLg = size === 'lg';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isLg ? 'center' : 'flex-start',
        gap: isLg ? '12px' : '10px',
        minWidth: 0,
        ...style,
      }}
    >
      <ChronoTrackLogo size={isLg ? 40 : 32} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          data-testid="brand-title"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: isLg ? 'var(--fs-20)' : 'var(--fs-16)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          ChronoTrack
        </span>
        <span
          data-testid="brand-subtitle"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-12)',
            fontWeight: 500,
            color: 'var(--text-muted)',
            lineHeight: 1.25,
          }}
        >
          Project Management
        </span>
      </div>
    </div>
  );
};
