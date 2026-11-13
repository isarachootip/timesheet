import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarRange,
  CheckSquare,
  Clock,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings as SettingsIcon,
  StickyNote,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '../../types';
import { ChronoTrackBrand } from '../ChronoTrackLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  unreadChatCount: number;
  onLogout: () => void;
}

const SidebarItem: React.FC<{ icon: LucideIcon; label: string; path: string; badgeCount?: number }> = ({
  icon: Icon,
  label,
  path,
  badgeCount,
}) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        margin: '0 8px',
        borderRadius: 'var(--radius-sm)',
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        fontSize: 'var(--fs-14)',
        transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1 }}>{label}</span>
      {badgeCount && badgeCount > 0 ? (
        <span
          style={{
            backgroundColor: 'var(--accent-danger)',
            color: '#FFFFFF',
            fontSize: 'var(--fs-12)',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 'var(--radius-full)',
            minWidth: '20px',
            textAlign: 'center',
          }}
        >
          {badgeCount}
        </span>
      ) : null}
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  unreadChatCount,
  onLogout,
}) => (
  <>
    {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <ChronoTrackBrand size="sm" />
        <button
          type="button"
          className="mobile-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>
      </div>

      <nav
        style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto' }}
        onClick={onClose}
      >
        <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" />
        <SidebarItem icon={Briefcase} label="Projects" path="/projects" />
        <SidebarItem icon={CalendarRange} label="Project Plan" path="/project-plan" />
        <SidebarItem icon={CheckSquare} label="Tasks" path="/tasks" />
        <SidebarItem icon={Clock} label="Timesheet" path="/timesheet" />
        <SidebarItem icon={StickyNote} label="Post-it Notes" path="/notes" />
        <SidebarItem icon={MessageSquare} label="Team Chat" path="/chat" badgeCount={unreadChatCount} />
        <SidebarItem icon={Users} label="Team & Users" path="/team" />
        <SidebarItem icon={BarChart3} label="Reports" path="/reports" />
        <SidebarItem icon={SettingsIcon} label="Settings" path="/settings" />
        <SidebarItem icon={HelpCircle} label="Help / FAQ" path="/help" />
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose();
          }}
          title="Log out"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>{currentUser.globalRole}</div>
          </div>
          <LogOut size={16} color="var(--text-muted)" />
        </button>
      </div>
    </aside>
  </>
);
