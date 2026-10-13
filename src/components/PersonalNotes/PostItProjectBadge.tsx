import React from 'react';
import { Briefcase, CheckCircle2 } from 'lucide-react';

interface PostItProjectBadgeProps {
  isProject: boolean;
  projectName?: string;
  taskTitle?: string;
  isLogged: boolean;
}

export const PostItProjectBadge: React.FC<PostItProjectBadgeProps> = ({
  isProject,
  projectName,
  taskTitle,
  isLogged,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {isProject && projectName ? (
        <span
          title={taskTitle ? `โครงการ: ${projectName} (${taskTitle})` : `โครงการ: ${projectName}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '12px',
            background: 'rgba(2, 132, 199, 0.15)',
            color: '#0369a1',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Briefcase size={11} />
          <span>{projectName}</span>
        </span>
      ) : (
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#a16207',
          }}
        >
          ส่วนตัว
        </span>
      )}

      {isLogged && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '10px',
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#15803d',
          }}
        >
          <CheckCircle2 size={11} /> ลงเวลาแล้ว
        </span>
      )}
    </div>
  );
};
export default PostItProjectBadge;
