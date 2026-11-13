import React, { useState } from 'react';
import { Check, Clock } from 'lucide-react';
import type { Task } from '../../types';

interface ActualHoursModalProps {
  task: Task;
  onConfirm: (actualHours: number, startTime?: string, endTime?: string) => void;
  onCancel: () => void;
}

export const ActualHoursModal: React.FC<ActualHoursModalProps> = ({
  task,
  onConfirm,
  onCancel,
}) => {
  const planned = task.estimatedHours && task.estimatedHours > 0 ? task.estimatedHours : 8;
  const defaultHours = planned > 8 ? 8 : planned;

  const [hours, setHours] = useState(String(defaultHours));
  const [startTime, setStartTime] = useState(defaultHours === 8 ? '09:00' : defaultHours === 4 ? '09:00' : '');
  const [endTime, setEndTime] = useState(defaultHours === 8 ? '17:00' : defaultHours === 4 ? '13:00' : '');

  const BAR_START = 6;
  const BAR_END = 22;
  const SLOTS = (BAR_END - BAR_START) * 2;
  const slotToTime = (slot: number) =>
    `${String(BAR_START + Math.floor(slot / 2)).padStart(2, '0')}:${String((slot % 2) * 30).padStart(2, '0')}`;
  const timeToSlot = (t: string) => {
    if (!t) return -1;
    const [h, m] = t.split(':').map(Number);
    return (h - BAR_START) * 2 + Math.round(m / 30);
  };
  const startSlot = timeToSlot(startTime);
  const endSlot = timeToSlot(endTime);
  const calcDiff = (s: string, e: string) => {
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
  };

  const handleStartChange = (val: string) => {
    setStartTime(val);
    if (val && endTime) {
      const d = calcDiff(val, endTime);
      if (d > 0) setHours(String(d));
    }
  };

  const handleEndChange = (val: string) => {
    setEndTime(val);
    if (startTime && val) {
      const d = calcDiff(startTime, val);
      if (d > 0) setHours(String(d));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(hours);
    if (!val || val <= 0) return;
    onConfirm(val, startTime || undefined, endTime || undefined);
  };

  return (
    <div
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
        style={{
          padding: '24px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--fs-16)', color: 'var(--text-primary)' }}>
              Log Actual Hours
            </div>
            <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
              Task moved to In Progress
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: 'var(--fs-14)' }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Planned:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{planned}h</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Work Period — Drag to select time range
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-13)' }}>
                {startTime && endTime ? (
                  <>
                    <span style={{ backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {startTime}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <span style={{ backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {endTime}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>Click and drag on the bar below</span>
                )}
              </div>
              {hours && (
                <span style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--fs-16)', color: 'var(--text-primary)' }}>
                  {hours}h
                </span>
              )}
            </div>

            <div
              style={{
                position: 'relative',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                userSelect: 'none',
                cursor: 'crosshair',
              }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const slot = Math.max(0, Math.min(SLOTS, Math.round(((e.clientX - rect.left) / rect.width) * SLOTS)));
                setStartTime(slotToTime(slot));
                setEndTime('');
                setHours('');
                const mv = (ev: MouseEvent) => {
                  const ms = Math.max(0, Math.min(SLOTS, Math.round(((ev.clientX - rect.left) / rect.width) * SLOTS)));
                  if (ms !== slot) {
                    const s = Math.min(slot, ms);
                    const en = Math.max(slot, ms);
                    setStartTime(slotToTime(s));
                    setEndTime(slotToTime(en));
                    const d = (en - s) * 0.5;
                    if (d > 0) setHours(String(d));
                  }
                };
                const up = () => {
                  document.removeEventListener('mousemove', mv);
                  document.removeEventListener('mouseup', up);
                };
                document.addEventListener('mousemove', mv);
                document.addEventListener('mouseup', up);
              }}
            >
              <div style={{ display: 'flex', height: 22 }}>
                {Array.from({ length: BAR_END - BAR_START }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 'var(--fs-12)',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      borderLeft: i > 0 ? '1px solid var(--border-color)' : 'none',
                      paddingTop: 2,
                    }}
                  >
                    {String(BAR_START + i).padStart(2, '0')}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', height: 32 }}>
                {Array.from({ length: SLOTS }, (_, i) => {
                  const sel = startSlot >= 0 && endSlot > startSlot && i >= startSlot && i < endSlot;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: sel ? 'var(--accent-subtle)' : 'transparent',
                        borderLeft: '1px solid var(--border-color)',
                        position: 'relative',
                      }}
                    >
                      {sel && i === startSlot && (
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: 'var(--accent-primary)' }} />
                      )}
                      {sel && i === endSlot - 1 && (
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: 'var(--accent-primary)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
              <input type="time" value={startTime} onChange={(e) => handleStartChange(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', color: 'var(--text-primary)', fontSize: 'var(--fs-13)' }} />
              <input type="time" value={endTime} onChange={(e) => handleEndChange(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', color: 'var(--text-primary)', fontSize: 'var(--fs-13)' }} />
              <input type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', color: 'var(--text-primary)', fontSize: 'var(--fs-13)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 'var(--fs-14)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-contrast)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'var(--fs-14)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Check size={16} /> Submit Timesheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
