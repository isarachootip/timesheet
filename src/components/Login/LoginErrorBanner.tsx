import { AlertCircle } from 'lucide-react';

interface LoginErrorBannerProps {
  errorParam: string | null;
  errorEmail: string | null;
}

export const LoginErrorBanner = ({ errorParam, errorEmail }: LoginErrorBannerProps) => {
  if (!errorParam) return null;

  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        color: 'var(--text-primary)',
        fontSize: 'var(--fs-13)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <strong
        style={{
          color: 'var(--accent-danger)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <AlertCircle size={16} /> ล็อกอินไม่สำเร็จ / Sign in Failed
      </strong>
      {errorParam === 'unauthorized' ? (
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          บัญชี LINE ของคุณยังไม่ได้ลงทะเบียนในระบบ {errorEmail && `(${errorEmail})`}{' '}
          กรุณาติดต่อ Admin เพื่อลงทะเบียนอีเมลของท่านก่อนเข้าใช้งานครั้งแรกครับ
        </p>
      ) : (
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          เกิดข้อผิดพลาด: {decodeURIComponent(errorParam)}
        </p>
      )}
    </div>
  );
};
