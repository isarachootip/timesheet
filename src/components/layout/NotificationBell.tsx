import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';
import type { Task, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { isTaskDueSoon, isTaskOverdue } from '../../utils/overdueUtils';

export interface ChatNotificationItem {
  id: string;
  projectId: string;
  projectName: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  type?: 'chat' | 'system' | 'approval';
}

export const NotificationBell: React.FC<{ tasks: Task[]; currentUser: User }> = ({ tasks, currentUser }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [chatNotifications, setChatNotifications] = useState<ChatNotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status !== 'Done' && t.endDate);
  const overdue = myTasks.filter((t) => isTaskOverdue(t, today));
  const dueSoon = myTasks.filter((t) => isTaskDueSoon(t, today));
  const dueThisWeek = myTasks.filter((t) => {
    const d = new Date(t.endDate!);
    return !isTaskOverdue(t, today) && !isTaskDueSoon(t, today) && d <= in7Days;
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}/chat-notifications`);
      if (res.ok) {
        const data: ChatNotificationItem[] = await res.json();
        setChatNotifications(data);
      }
    } catch {
      // Silently ignore background poll failures
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 5000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadChat = chatNotifications.filter((n) => !n.isRead);
  const total = overdue.length + dueSoon.length + dueThisWeek.length + unreadChat.length;

  const handleMarkAsRead = async (notifId: string, projectId: string) => {
    try {
      await fetch(`/api/chat-notifications/${notifId}/read`, { method: 'POST' });
      fetchNotifications();
      setOpen(false);
      navigate(`/chat?projectId=${projectId}`);
    } catch {
      // Ignore transient mark-read failure
    }
  };

  const renderSection = (icon: React.ReactNode, label: string, list: Task[], color: string) =>
    list.length > 0 ? (
      <>
        <div
          style={{
            padding: '8px 14px',
            fontSize: 'var(--fs-12)',
            fontWeight: 600,
            color,
            backgroundColor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {icon} {label} ({list.length})
        </div>
        {list.map((t) => (
          <div key={t.id} className="notif-item" onClick={() => { setOpen(false); navigate('/tasks'); }} style={{ cursor: 'pointer' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
              <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', marginTop: '2px' }}>
                Due: {formatToDDMMYYYY(t.endDate)}
              </div>
            </div>
          </div>
        ))}
      </>
    ) : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="notif-bell-btn" onClick={() => setOpen((o) => !o)} title="Notifications" aria-label="Notifications">
        <Bell size={18} />
        {total > 0 && <span className="notif-badge">{total > 9 ? '9+' : total}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--fs-14)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={15} /> Notifications
            </span>
            <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>{total} items</span>
          </div>
          {total === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-13)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="var(--dot-success)" />
              <span>All caught up. No new notifications.</span>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {unreadChat.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px', fontSize: 'var(--fs-12)', fontWeight: 600, color: 'var(--accent-primary)', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={13} /> Chat & System ({unreadChat.length})
                  </div>
                  {unreadChat.map((n) => (
                    <div key={n.id} className="notif-item" onClick={() => handleMarkAsRead(n.id, n.projectId)} style={{ cursor: 'pointer' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--fs-13)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {n.type === 'system' && <AlertCircle size={13} color="var(--accent-danger)" />}
                          {n.type === 'approval' && <CheckSquare size={13} color="var(--dot-success)" />}
                          <span>
                            <strong>{n.senderName}</strong> in #{n.projectName}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {renderSection(<AlertTriangle size={13} />, 'Overdue Tasks', overdue, 'var(--accent-danger)')}
              {renderSection(<AlertCircle size={13} />, 'Due in 3 days', dueSoon, 'var(--dot-warning)')}
              {renderSection(<CalendarClock size={13} />, 'Due this week', dueThisWeek, 'var(--accent-primary)')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
