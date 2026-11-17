import { ArrowRight, Shield } from 'lucide-react';
import type { User } from '../../types';
import { isLocalDemoHostname } from '../../utils/bootstrapQueryFlags';

interface LoginDemoSwitcherProps {
  availableUsers: User[];
  onLogin: (user: User) => void;
}

export const LoginDemoSwitcher = ({ availableUsers, onLogin }: LoginDemoSwitcherProps) => {
  if (typeof window === 'undefined' || !isLocalDemoHostname(window.location.hostname)) {
    return null;
  }

  return (
    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
      <h4
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
          textAlign: 'center',
        }}
      >
        Or sign in with Demo Account (Dev Only)
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {availableUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            onClick={() => onLogin(user)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all var(--transition-fast)',
            }}
            className="hover-lift"
          >
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Shield size={10} color="var(--accent-primary)" />
                <span>
                  {user.globalRole} ({user.department})
                </span>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
};
