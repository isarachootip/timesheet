import { useState } from 'react';
import { Clock, Shield, ArrowRight } from 'lucide-react';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

export const Login = ({ onLogin, availableUsers }: LoginProps) => {
  const [showLineAuth, setShowLineAuth] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);

  const handleLineLogin = () => {
    setLineLoading(true);
    setTimeout(() => {
      setLineLoading(false);
      setShowLineAuth(true);
    }, 1200);
  };

  const confirmLineAuth = () => {
    // Mock user created via LINE authentication
    const lineMockUser: User = {
      id: 'u_line_' + Date.now(),
      name: 'Isara Ch.',
      email: 'isara.ch@line-user.com',
      avatar: 'https://i.pravatar.cc/150?u=line',
      globalRole: 'Employee',
      department: 'Engineering'
    };
    onLogin(lineMockUser);
  };

  return (
    <div style={{
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
      overflow: 'hidden'
    }}>
      {/* Background Lights */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(6, 199, 85, 0.15) 0%, transparent 70%)',
        top: '10%',
        left: '15%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        bottom: '10%',
        right: '15%',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        padding: '3rem 2.5rem',
        width: '450px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        boxShadow: 'var(--shadow-glass)',
        position: 'relative'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
            <Clock size={28} color="white" />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>NexTime</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Project & Timesheet Management System</p>
        </div>

        {/* Authentication Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* LINE Login Button */}
          <button 
            onClick={handleLineLogin}
            disabled={lineLoading}
            style={{
              background: '#06C755',
              color: 'white',
              border: 'none',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              fontSize: '1rem',
              transition: 'all var(--transition-fast)'
            }}
            className="hover-lift"
          >
            {lineLoading ? (
              <span>Connecting to LINE...</span>
            ) : (
              <>
                {/* Simulated LINE logo icon */}
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', color: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>L</div>
                <span>Sign in with LINE</span>
              </>
            )}
          </button>
        </div>

        {/* Fast Switcher Section (For Demo Roles) */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
            Or sign in with Demo Account
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {availableUsers.slice(0, 3).map(user => (
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
                  transition: 'all var(--transition-fast)'
                }}
                className="hover-lift"
              >
                <img src={user.avatar} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Shield size={10} color="var(--accent-primary)" />
                    <span>{user.globalRole} ({user.department})</span>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulated LINE Auth Overlay Dialog */}
      {showLineAuth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            color: '#111',
            padding: '2rem',
            borderRadius: '16px',
            width: '380px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>L</div>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: '#111' }}>LINE Login Authorization</h3>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>NexTime app requests permission</span>
              </div>
            </div>

            {/* Permission list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#444' }}>
              <p>Allow **NexTime** to access your LINE account info:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <input type="checkbox" defaultChecked disabled />
                <span>Your Name & Avatar Image (Required)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f5f5f5', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <input type="checkbox" defaultChecked disabled />
                <span>Your Email Address</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setShowLineAuth(false)}
                style={{ flex: 1, padding: '0.65rem', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLineAuth}
                style={{ flex: 1, padding: '0.65rem', background: '#06C755', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
