import React from 'react';
import { Save, X } from 'lucide-react';

interface SaveBaselineModalProps {
  open: boolean;
  name: string;
  description: string;
  saving: boolean;
  onNameChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-13)',
  outline: 'none',
};

export const SaveBaselineModal: React.FC<SaveBaselineModalProps> = ({
  open,
  name,
  description,
  saving,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save Plan Baseline Version"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-backdrop)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="surface-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Save Baseline Version
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--fs-12)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Version Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. v1_baseline, sprint_2_kickoff"
              style={fieldStyle}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--fs-12)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-13)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-contrast)',
                fontSize: 'var(--fs-13)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.65 : 1,
              }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
