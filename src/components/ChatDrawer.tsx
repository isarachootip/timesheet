import React from 'react';
import ChatWidget from './ChatWidget';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ChronoTrack Assistant"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-backdrop)',
        zIndex: 1050,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          maxWidth: '100vw',
          height: '100vh',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <ChatWidget onClose={onClose} />
      </div>
    </div>
  );
};
