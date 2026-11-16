import React, { useState } from 'react';
import { CalendarOff, CheckCircle2, CheckSquare, X } from 'lucide-react';
import { CustomDateInput } from '../CustomDateInput';
import { toast } from '../ui/ToastProvider';

interface TasksBulkActionBarProps {
  selectedCount: number;
  availableStatuses: string[];
  defaultDoneStatus: string;
  isSubmitting: boolean;
  onApplyStatus: (status: string) => void;
  onApplyEndDate: (endDate: string) => void;
  onClearEndDate: () => void;
  onClearSelection: () => void;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 10px',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-13)',
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
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

export const TasksBulkActionBar: React.FC<TasksBulkActionBarProps> = ({
  selectedCount,
  availableStatuses,
  defaultDoneStatus,
  isSubmitting,
  onApplyStatus,
  onApplyEndDate,
  onClearEndDate,
  onClearSelection,
}) => {
  const [status, setStatus] = useState<string>(defaultDoneStatus);
  const [endDate, setEndDate] = useState<string>('');

  if (selectedCount === 0) return null;

  const activeStatus = availableStatuses.includes(status) ? status : defaultDoneStatus;

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
        <span>{selectedCount} task(s) selected</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onApplyStatus(defaultDoneStatus)}
          style={{ ...btnStyle, background: 'var(--dot-success)', color: '#fff', border: 'none' }}
        >
          <CheckCircle2 size={14} /> Mark Done ({defaultDoneStatus})
        </button>

        <select
          aria-label="Bulk task status"
          value={activeStatus}
          onChange={(e) => setStatus(e.target.value)}
          disabled={isSubmitting}
          style={inputStyle}
        >
          {availableStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onApplyStatus(activeStatus)}
          style={{ ...btnStyle, background: 'var(--accent-primary)', color: '#fff', border: 'none' }}
        >
          Apply Status
        </button>

        <CustomDateInput
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ ...inputStyle, width: '140px' }}
        />
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            if (!endDate) {
              toast.error('Please pick a new End Date first.');
              return;
            }
            onApplyEndDate(endDate);
          }}
          style={btnStyle}
        >
          Shift End Date
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClearEndDate}
          style={btnStyle}
        >
          <CalendarOff size={13} /> Clear Date
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClearSelection}
          style={{ ...btnStyle, color: 'var(--text-secondary)' }}
        >
          <X size={13} /> Clear
        </button>
      </div>
    </div>
  );
};
