import React from 'react';
import { formatToDDMMYYYY } from '../utils';

interface CustomDateInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  required?: boolean;
  min?: string;
  max?: string;
}

export const CustomDateInput = ({ value, onChange, style, required, min, max }: CustomDateInputProps) => {
  const formatted = value ? formatToDDMMYYYY(value) : 'dd/mm/yyyy';
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input
        type="date"
        className="date-input-hidden-text"
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        style={{
          ...style,
        }}
      />
      <span style={{
        position: 'absolute',
        left: '0.6rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        pointerEvents: 'none',
        fontSize: '0.8rem'
      }}>
        {formatted}
      </span>
    </div>
  );
};
