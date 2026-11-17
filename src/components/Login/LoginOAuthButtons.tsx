import { useState } from 'react';

export const LoginOAuthButtons = () => {
  const [lineLoading, setLineLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  const handleLineLogin = () => {
    setLineLoading(true);
    const origin = window.location.origin;
    window.location.href = `/api/auth/line?origin=${encodeURIComponent(origin)}`;
  };

  const handleMicrosoftLogin = () => {
    setMsLoading(true);
    const origin = window.location.origin;
    window.location.href = `/api/auth/microsoft?origin=${encodeURIComponent(origin)}`;
  };

  return (
    <>
      <button
        type="button"
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
          transition: 'all var(--transition-fast)',
        }}
        className="hover-lift"
      >
        {lineLoading ? (
          <span>Connecting to LINE...</span>
        ) : (
          <>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                color: '#06C755',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            >
              L
            </div>
            <span>Sign in with LINE OA</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleMicrosoftLogin}
        disabled={msLoading}
        style={{
          background: '#0078D4',
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
          transition: 'all var(--transition-fast)',
        }}
        className="hover-lift"
      >
        {msLoading ? (
          <span>Connecting to Microsoft...</span>
        ) : (
          <>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                background: 'white',
                color: '#0078D4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            >
              M
            </div>
            <span>Sign in with Microsoft (Outlook)</span>
          </>
        )}
      </button>
    </>
  );
};
