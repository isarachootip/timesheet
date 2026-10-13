import React from 'react';
import { X, Clock, Calendar, CheckCircle, Briefcase, FileText } from 'lucide-react';
import type { PersonalNote, Project, Task, User } from '../../types';
import { useTimesheetImportForm } from './useTimesheetImportForm';

interface ImportNoteToTimesheetModalProps {
  isOpen: boolean;
  note: PersonalNote | null;
  onClose: () => void;
  currentUser: User;
  projects: Project[];
  tasks: Task[];
  onCompleteNote?: (noteId: string) => Promise<unknown>;
}

export const ImportNoteToTimesheetModal: React.FC<ImportNoteToTimesheetModalProps> = (props) => {
  const { isOpen, note, onClose } = props;
  const form = useTimesheetImportForm(props);

  if (!isOpen || !note) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', borderRadius: '14px', padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 20px 45px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(6, 199, 85, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#06C755" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>นำเข้าสู่ Timesheet ประจำวัน</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>แปลงบันทึกช่วยจำเป็นบันทึกเวลาทำงาน</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        {form.errorMsg && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>{form.errorMsg}</div>}

        <form onSubmit={form.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Work Type Segmented Selector */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => form.setIsPersonal(false)}
              style={{
                flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                fontWeight: !form.isPersonal ? 700 : 500,
                background: !form.isPersonal ? 'var(--accent-primary)' : 'transparent',
                color: !form.isPersonal ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
              }}
            >
              <Briefcase size={14} /> งานในโครงการ (Project)
            </button>
            <button
              type="button"
              onClick={() => form.setIsPersonal(true)}
              style={{
                flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                fontWeight: form.isPersonal ? 700 : 500,
                background: form.isPersonal ? '#eab308' : 'transparent',
                color: form.isPersonal ? '#713f12' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
              }}
            >
              <span>🟡 งานส่วนตัว / ทั่วไป</span>
            </button>
          </div>

          {!form.isPersonal ? (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Briefcase size={14} /> โครงการ (Project) *
                </label>
                <select value={form.projectId} onChange={(e) => { form.setProjectId(e.target.value); form.setTaskId(''); }} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="">-- เลือกโครงการ --</option>
                  {form.availableProjects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>

              {form.availableTasks.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>งานที่เกี่ยวข้อง (Task - ไม่บังคับ)</label>
                  <select value={form.taskId} onChange={(e) => form.setTaskId(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    <option value="">-- ไม่ระบุงานย่อย --</option>
                    {form.availableTasks.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px dashed #eab308', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#a16207' }}>
              ⚡ <strong>งานส่วนตัว / กิจกรรมทั่วไป</strong> จะไม่ถูกนำเข้า Project ลูกค้า ไม่คิดต้นทุนเข้าโครงการ และอนุมัติอัตโนมัติทันที
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Calendar size={14} /> วันที่ (Date) *
              </label>
              <input type="date" value={form.date} onChange={(e) => form.setDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Clock size={14} /> จำนวนชั่วโมง *
              </label>
              <input type="number" step="0.25" min="0.25" max="24" value={form.hours} onChange={(e) => form.setHours(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['1', '2', '4', '8'].map((h) => (
              <button key={h} type="button" onClick={() => form.setHours(h)} style={{ flex: 1, padding: '3px 0', fontSize: '0.75rem', borderRadius: '4px', border: form.hours === h ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', background: form.hours === h ? 'rgba(6,199,85,0.15)' : 'var(--bg-tertiary)', color: form.hours === h ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                {h} ชม.
              </button>
            ))}
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <FileText size={14} /> รายละเอียดงาน (Description) *
            </label>
            <input type="text" value={form.description} onChange={(e) => form.setDescription(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ผลงานที่ได้ (Work Results - บันทึกจาก Post-it)</label>
            <textarea rows={2} value={form.workResults} onChange={(e) => form.setWorkResults(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0.4rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.markAsCompleted} onChange={(e) => form.setMarkAsCompleted(e.target.checked)} />
              <CheckCircle size={15} color="#16a34a" />
              <span>ทำเครื่องหมาย Post-it นี้ว่าเสร็จสิ้นแล้วหลังนำเข้า</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isWfh} onChange={(e) => form.setIsWfh(e.target.checked)} />
              <span>ทำงานที่บ้าน (WFH)</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} disabled={form.isSubmitting} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" disabled={form.isSubmitting} className="btn-primary hover-lift" style={{ padding: '0.55rem 1.3rem', borderRadius: '6px', cursor: form.isSubmitting ? 'not-allowed' : 'pointer' }}>
              {form.isSubmitting ? 'กำลังบันทึก...' : 'บันทึก Timesheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ImportNoteToTimesheetModal;
