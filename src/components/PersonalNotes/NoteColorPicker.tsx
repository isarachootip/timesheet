import React from 'react';
import { Check } from 'lucide-react';
import type { PostItColor } from '../../types';
import { COLOR_THEMES } from './noteUtils';

const COLORS: PostItColor[] = ['yellow', 'blue', 'green', 'pink', 'orange', 'purple'];

interface NoteColorPickerProps {
  color: PostItColor;
  setColor: (color: PostItColor) => void;
}

export const NoteColorPicker: React.FC<NoteColorPickerProps> = ({ color, setColor }) => {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
        สี Post-it
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {COLORS.map((c) => {
          const t = COLOR_THEMES[c];
          const isSelected = color === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: t.bg,
                border: isSelected ? `2.5px solid ${t.accent}` : `1px solid ${t.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {isSelected && <Check size={16} color={t.textColor} strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default NoteColorPicker;
