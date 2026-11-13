import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Menu, Moon, Search, Settings as SettingsIcon, Sun } from 'lucide-react';
import type { Task, User } from '../../types';
import { getRouteMeta } from '../../utils/routeMeta';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  currentUser: User;
  tasks: Task[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
  onOpenPalette: () => void;
  onOpenChat: () => void;
}

const iconButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  borderRadius: 'var(--radius-sm)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '36px',
  padding: '0 10px',
  gap: '6px',
  fontSize: 'var(--fs-13)',
  fontWeight: 500,
  transition: 'background-color var(--transition-fast), color var(--transition-fast)',
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  tasks,
  theme,
  onToggleTheme,
  onOpenSidebar,
  onOpenPalette,
  onOpenChat,
}) => {
  const location = useLocation();
  const routeMeta = getRouteMeta(location.pathname);

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}
        >
          <Menu size={22} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 'var(--fs-20)', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
            {routeMeta.title}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onOpenPalette}
          title="Search & commands (Ctrl+K)"
          aria-label="Open command palette"
          style={{ ...iconButtonStyle, minWidth: '36px' }}
        >
          <Search size={15} />
          <span className="hide-mobile" style={{ color: 'var(--text-muted)' }}>Search</span>
          <kbd
            className="hide-mobile"
            style={{
              fontSize: 'var(--fs-12)',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1px 5px',
            }}
          >
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onOpenChat}
          title="ChronoTrack Assistant"
          aria-label="Open AI Assistant"
          style={iconButtonStyle}
        >
          <Bot size={16} color="var(--accent-primary)" />
          <span className="hide-mobile" style={{ color: 'var(--text-primary)' }}>Assistant</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle color theme"
          style={{ ...iconButtonStyle, width: '36px', padding: 0 }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <NotificationBell tasks={tasks} currentUser={currentUser} />

        <Link
          to="/settings"
          className="hide-mobile"
          style={{ ...iconButtonStyle, color: 'var(--text-primary)' }}
        >
          <SettingsIcon size={16} />
          <span>Settings</span>
        </Link>
      </div>
    </header>
  );
};
