import React, { useId } from 'react';

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

const MAJOR_ANGLES = [0, 90, 180, 270];
const MINOR_ANGLES = [30, 60, 120, 150, 210, 240, 300, 330];

export const ChronoTrackLogo: React.FC<ChronoTrackLogoProps> = ({
  size = 40,
  className,
  style,
}) => {
  const uid = useId().replace(/:/g, '');
  const goldGradId = `chrono-gold-${uid}`;
  const needleGradId = `chrono-needle-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 108"
      fill="none"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-label="CHRONOTRACK Logo"
    >
      <defs>
        <linearGradient id={goldGradId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#C9A882" />
          <stop offset="35%" stopColor="#F3DFC1" />
          <stop offset="68%" stopColor="#D5B48B" />
          <stop offset="100%" stopColor="#A68660" />
        </linearGradient>
        <linearGradient id={needleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0D4" />
          <stop offset="55%" stopColor="#E4C494" />
          <stop offset="100%" stopColor="#B69266" />
        </linearGradient>
      </defs>

      {/* Top Crown (12 o'clock) */}
      <line x1="46.5" y1="10.5" x2="46.5" y2="16.5" stroke={`url(#${goldGradId})`} strokeWidth="2.4" />
      <line x1="53.5" y1="10.5" x2="53.5" y2="16.5" stroke={`url(#${goldGradId})`} strokeWidth="2.4" />
      <rect x="41" y="3" width="18" height="7.5" rx="2.4" stroke={`url(#${goldGradId})`} strokeWidth="2.4" />

      {/* Angled Side Pusher (~34 deg) */}
      <g transform="rotate(34 50 57)">
        <line x1="47.5" y1="11.5" x2="47.5" y2="16.5" stroke={`url(#${goldGradId})`} strokeWidth="2.2" />
        <line x1="52.5" y1="11.5" x2="52.5" y2="16.5" stroke={`url(#${goldGradId})`} strokeWidth="2.2" />
        <rect x="43.5" y="6" width="13" height="5.5" rx="2" stroke={`url(#${goldGradId})`} strokeWidth="2.2" />
      </g>

      {/* Double Concentric Outer Bezel Rings */}
      <circle cx="50" cy="57" r="40.5" stroke={`url(#${goldGradId})`} strokeWidth="2.4" />
      <circle cx="50" cy="57" r="35.5" stroke={`url(#${goldGradId})`} strokeWidth="2.2" />

      {/* Cardinal Major Ticks (12, 3, 6, 9) */}
      {MAJOR_ANGLES.map((deg) => (
        <line
          key={`maj-${deg}`}
          x1="50"
          y1="21.5"
          x2="50"
          y2="29"
          stroke={`url(#${goldGradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          transform={`rotate(${deg} 50 57)`}
        />
      ))}

      {/* Minor Bezel Ticks */}
      {MINOR_ANGLES.map((deg) => (
        <line
          key={`min-${deg}`}
          x1="50"
          y1="21.5"
          x2="50"
          y2="27.2"
          stroke="#7E8794"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${deg} 50 57)`}
        />
      ))}

      {/* Inner Chronograph Track Arc */}
      <path
        d="M 50 31.5 L 50 35.5 A 21.5 21.5 0 1 0 71.1 53.2"
        stroke="#7E8794"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tapered Gold Chronograph Needle (pointing to ~1:30 / 45 deg) */}
      <g transform="rotate(45 50 57)">
        <path
          d="M 50 28 L 52.4 53.5 A 3.6 3.6 0 1 1 47.6 53.5 Z"
          fill={`url(#${needleGradId})`}
        />
        <path
          d="M 48.7 59.8 L 51.3 59.8 L 50 65.5 Z"
          fill={`url(#${needleGradId})`}
        />
        <circle cx="50" cy="57" r="1.6" fill="#1E242B" />
      </g>
    </svg>
  );
};

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
        gap: isLg ? '0.9rem' : '0.6rem',
        maxWidth: '100%',
        ...style,
      }}
    >
      <ChronoTrackLogo size={isLg ? 60 : 40} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '2px',
        }}
      >
        <div
          className={isLg ? 'chronotrack-brand-title-lg' : 'chronotrack-brand-title-sm'}
          style={{
            margin: 0,
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.15em',
            paddingLeft: '0.15em',
            textTransform: 'uppercase',
            backgroundImage:
              'linear-gradient(90deg, #B59571 0%, #DFC39D 25%, #F6E6CF 50%, #C6A47E 78%, #9E805D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
          }}
        >
          CHRONOTRACK
        </div>
        <div
          className={`chronotrack-brand-subtitle ${isLg ? 'chronotrack-brand-subtitle-lg' : 'chronotrack-brand-subtitle-sm'}`}
          style={{
            marginTop: isLg ? '0.3rem' : '0.2rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            letterSpacing: '0.22em',
            paddingLeft: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            opacity: 0.9,
            whiteSpace: 'nowrap',
          }}
        >
          PROJECT MANAGEMENT
        </div>
      </div>
    </div>
  );
};
