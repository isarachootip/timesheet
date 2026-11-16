import React, { useState } from 'react';
import { CalendarOff, CheckSquare, X } from 'lucide-react';
import type { ProjectStatus } from '../../types';
import { CustomDateInput } from '../CustomDateInput';
import { toast } from '../ui/ToastProvider';

interface ProjectsBulkActionBarProps {
  selectedCount: number;
  isSubmitting: boolean;
  onApplyStatus: (status: ProjectStatus) => void;
  onApplyEndDate: (endDate: string) => void;
  onClearEndDate: () => void;
  onClearSelection: () => void;
}

const controlStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 10px',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-13)',
  outline: 'none',
};

const actionBtnStyle: React.CSSProperties = {
  borderRadius: 'var(--radius-sm)',
  padding: '6px 12px',
  fontSize: 'var(--fs-12)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
};

export const ProjectsBulkActionBar: React.FC<ProjectsBulkActionBarProps> = ({
  selectedCount,
  isSubmitting,
  onApplyStatus,
  onApplyEndDate,
  onClearEndDate,
  onClearSelection,
}) => {
  const [status, setStatus] = useState<ProjectStatus>('Completed');
  const [endDate, setEndDate] = useState('');

  if (selectedCount === 0) return null;

  return (
    <div
      className="surface-card"
      style={{
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        border: '1px solid var(--accent-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: 'var(--fs-13)' }}>
        <CheckSquare size={16} color="var(--accent-primary)" />
        <span>{selectedCount} project(s) selected</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <select
          aria-label="Bulk project status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          disabled={isSubmitting}
          style={controlStyle}
        >
          <option value="Completed">Completed</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Planning">Planning</option>
        </select>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onApplyStatus(status)}
          style={{ ...actionBtnStyle, background: 'var(--accent-primary)', color: '#fff', border: 'none' }}
        >
          Apply Status
        </button>

        <CustomDateInput
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ ...controlStyle, width: '140px' }}
        />
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            if (!endDate) {
              toast.error('Please choose a new End Date first.');
              return;
            }
            onApplyEndDate(endDate);
          }}
          style={actionBtnStyle}
        >
          Set End Date
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClearEndDate}
          title="Remove End Date so project displays as Ongoing"
          style={actionBtnStyle}
        >
          <CalendarOff size={13} /> Set Ongoing
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClearSelection}
          style={{ ...actionBtnStyle, color: 'var(--text-secondary)' }}
        >
          <X size={13} /> Clear
        </button>
      </div>
    </div>
  );
};
