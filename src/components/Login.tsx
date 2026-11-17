import { useState } from 'react';
import { ChronoTrackBrand } from './ChronoTrackLogo';
import { LoginDemoSwitcher } from './Login/LoginDemoSwitcher';
import { LoginErrorBanner } from './Login/LoginErrorBanner';
import { LoginOAuthButtons } from './Login/LoginOAuthButtons';
import { loginWithPassword } from '../services/authApi';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '0.75rem 1rem',
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
  fontSize: '0.9rem',
  transition: 'border-color var(--transition-fast)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  marginBottom: '0.35rem',
  display: 'block',
  fontWeight: 500,
};

export const Login = ({ onLogin, availableUsers }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('กรุณากรอกอีเมลและรหัสผ่าน / Please enter email and password');
      return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const user = await loginWithPassword(email, password);
      onLogin(user);
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ / Connection error'
      );
    } finally {
      setLoading(false);
    }
  };

  const params = new URLSearchParams(window.location.search);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'var(--bg-primary)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '3rem 2.5rem',
          width: '450px',
          maxWidth: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          boxShadow: 'var(--shadow-glass)',
          position: 'relative',
        }}
      >
        <ChronoTrackBrand size="lg" />
        <LoginErrorBanner errorParam={params.get('error')} errorEmail={params.get('email')} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            {loginError && (
              <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%',
                fontSize: '1rem',
                transition: 'all var(--transition-fast)',
                opacity: loading ? 0.7 : 1,
              }}
              className="hover-lift"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              margin: '0.5rem 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ padding: '0 0.75rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <LoginOAuthButtons />
        </div>

        <LoginDemoSwitcher availableUsers={availableUsers} onLogin={onLogin} />
      </div>
    </div>
  );
};
