import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

type ToastListener = (item: ToastItem) => void;
const listeners = new Set<ToastListener>();

const emitToast = (message: string, tone: ToastTone) => {
  const item: ToastItem = {
    id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message,
    tone,
  };
  listeners.forEach((listener) => listener(item));
};

export const toast = {
  info: (message: string) => emitToast(message, 'info'),
  success: (message: string) => emitToast(message, 'success'),
  error: (message: string) => emitToast(message, 'error'),
};

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: (message, tone = 'info') => emitToast(message, tone),
});

export const useToast = (): ToastContextValue => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const handler: ToastListener = (item) => {
      setItems((prev) => [...prev.slice(-4), item]);
      window.setTimeout(() => dismiss(item.id), 4500);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [dismiss]);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    emitToast(message, tone);
  }, []);

  const iconForTone = (tone: ToastTone) => {
    if (tone === 'error') return <AlertCircle size={16} color="var(--accent-danger)" />;
    if (tone === 'success') return <CheckCircle2 size={16} color="var(--dot-success)" />;
    return <Info size={16} color="var(--accent-primary)" />;
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {items.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '380px',
            width: 'calc(100vw - 32px)',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${item.tone === 'error' ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-13)',
              }}
            >
              <span style={{ marginTop: '2px', flexShrink: 0 }}>{iconForTone(item.tone)}</span>
              <span style={{ flex: 1, lineHeight: 1.45 }}>{item.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};
