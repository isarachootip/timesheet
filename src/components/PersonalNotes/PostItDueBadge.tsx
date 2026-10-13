import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { DueStatus } from './noteUtils';

interface PostItDueBadgeProps {
  dueStatus: DueStatus;
  isCompleted?: boolean;
}

export const PostItDueBadge: React.FC<PostItDueBadgeProps> = ({ dueStatus, isCompleted }) => {
  if (isCompleted) {
    return (
      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <Check size={12} /> เสร็จสิ้น
      </span>
    );
  }
  if (dueStatus === 'overdue') {
    return (
      <span style={{ fontSize: '0.72rem', color: '#dc2626', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <AlertCircle size={12} /> เลยกำหนด
      </span>
    );
  }
  if (dueStatus === 'due-today') {
    return (
      <span style={{ fontSize: '0.72rem', color: '#d97706', background: 'rgba(245,158,11,0.18)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
        ⚡ ครบกำหนดวันนี้
      </span>
    );
  }
  if (dueStatus === 'due-soon') {
    return (
      <span style={{ fontSize: '0.72rem', color: '#ea580c', background: 'rgba(234,88,12,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
        ใกล้ถึงกำหนด
      </span>
    );
  }
  return null;
};
export default PostItDueBadge;
