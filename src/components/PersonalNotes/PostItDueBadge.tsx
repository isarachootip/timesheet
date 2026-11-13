import React from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import type { DueStatus } from './noteUtils';

interface PostItDueBadgeProps {
  dueStatus: DueStatus;
  isCompleted?: boolean;
}

export const PostItDueBadge: React.FC<PostItDueBadgeProps> = ({ dueStatus, isCompleted }) => {
  if (isCompleted) {
    return (
      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--dot-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Check size={12} /> เสร็จสิ้น
      </span>
    );
  }
  if (dueStatus === 'overdue') {
    return (
      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--accent-danger)', background: 'var(--accent-danger-subtle)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <AlertCircle size={12} /> เลยกำหนด
      </span>
    );
  }
  if (dueStatus === 'due-today') {
    return (
      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--dot-warning)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={12} /> ครบกำหนดวันนี้
      </span>
    );
  }
  if (dueStatus === 'due-soon') {
    return (
      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--dot-warning)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
        ใกล้ถึงกำหนด
      </span>
    );
  }
  return null;
};
export default PostItDueBadge;
