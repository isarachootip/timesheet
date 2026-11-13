import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actions = [],
}) => (
  <div
    style={{
      padding: '32px 24px',
      border: '1px dashed var(--border-color)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '12px',
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={18} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '420px' }}>
      <h4 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
    </div>
    {actions.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
        {actions.map((action) => {
          const isPrimary = action.variant !== 'secondary';
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--fs-13)',
                fontWeight: 600,
                cursor: 'pointer',
                border: isPrimary ? 'none' : '1px solid var(--border-color)',
                backgroundColor: isPrimary ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: isPrimary ? 'var(--accent-contrast)' : 'var(--text-primary)',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    )}
  </div>
);
