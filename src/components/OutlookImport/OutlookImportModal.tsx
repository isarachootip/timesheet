import { Calendar, RefreshCw, Unlink, CheckSquare, X, ExternalLink } from 'lucide-react';
import type { Project, User, TaskPriority } from '../../types';
import { CustomDateInput } from '../CustomDateInput';
import { OutlookEventRow } from './OutlookEventRow';
import { useOutlookImport } from './useOutlookImport';

interface OutlookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  users: User[];
  currentUser: User;
  defaultProjectId?: string;
  returnPath?: string;
}

export const OutlookImportModal = ({
  isOpen,
  onClose,
  projects,
  users,
  currentUser,
  defaultProjectId = '',
  returnPath = '/tasks',
}: OutlookImportModalProps) => {
  const accessibleProjects = projects.filter(
    p =>
      currentUser.globalRole === 'Admin' ||
      currentUser.globalRole === 'Manager' ||
      p.members?.some(m => m.userId === currentUser.id)
  );

  const initialProjId =
    defaultProjectId && defaultProjectId !== 'all'
      ? defaultProjectId
      : accessibleProjects[0]?.id || '';

  const {
    status, startDate, setStartDate, endDate, setEndDate,
    events, selectedIds, setSelectedIds, hoursOverrides, setEventHours,
    projectId, setProjectId, assigneeId, setAssigneeId,
    priority, setPriority, issueType, setIssueType,
    loadingEvents, submitting, errorMessage, successMessage,
    fetchEvents, handleConnect, handleDisconnect, toggleSelect, submitImport,
  } = useOutlookImport({
    currentUserId: currentUser.id,
    defaultProjectId: initialProjId,
    returnPath,
    isOpen,
  });

  if (!isOpen) return null;

  const getProjectName = (id: string | null) =>
    id ? projects.find(p => p.id === id)?.name : undefined;

  const totalSelectedHours = events
    .filter(e => selectedIds.includes(e.outlookEventId))
    .reduce((sum, e) => sum + (hoursOverrides[e.outlookEventId] ?? e.estimatedHours), 0);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1200, padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '820px', maxWidth: '100%', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', gap: '1.1rem', padding: '1.75rem',
        }}
      >
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0, 120, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#0078D4" />
            </div>
            <div>
              <h2 className="text-gradient" style={{ fontSize: '1.35rem', margin: 0 }}>Import Tasks from Outlook Calendar</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                ดึงนัดหมายจาก Microsoft Outlook (Graph API) เพื่อสร้างหรือ Sync เป็น Project Task
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Connection Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
          {status.connected ? (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                🟢 เชื่อมต่อบัญชี Microsoft แล้ว: <strong>{status.msEmail || 'Connected'}</strong>
              </div>
              <button onClick={handleDisconnect} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--accent-danger)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Unlink size={13} /> Disconnect
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ยังไม่ได้เชื่อมต่อปฏิทิน Microsoft Outlook ของคุณ
              </div>
              <button onClick={handleConnect} style={{ background: '#0078D4', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ExternalLink size={14} /> Connect Microsoft Outlook
              </button>
            </>
          )}
        </div>

        {/* Date Filter & Target Settings */}
        {status.connected && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Start Date</label>
                <CustomDateInput value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>End Date</label>
                <CustomDateInput value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Target Project *</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%', padding: '0.48rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="">-- Select Project --</option>
                  {accessibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Assignee</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ width: '100%', padding: '0.48rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} title="Priority" style={{ flex: 1, padding: '0.48rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option>
                </select>
                <select value={issueType} onChange={e => setIssueType(e.target.value as 'Bug' | 'Story' | 'Task')} title="Issue Type" style={{ flex: 1, padding: '0.48rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  <option value="Task">Task</option><option value="Story">Story</option><option value="Bug">Bug</option>
                </select>
                <button onClick={() => void fetchEvents()} disabled={loadingEvents} title="Refresh Events" style={{ padding: '0.48rem 0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            <div className="flex-between" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>พบนัดหมายทั้งหมด {events.length} รายการ (เลือกแล้ว {selectedIds.length} รายการ • รวม {totalSelectedHours} ชม.)</span>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={() => setSelectedIds(events.filter(e => !e.existingTaskId).map(e => e.outlookEventId))} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.78rem' }}>เลือกเฉพาะรายการใหม่</button>
                <button type="button" onClick={() => setSelectedIds(events.map(e => e.outlookEventId))} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.78rem' }}>เลือกทั้งหมด</button>
                <button type="button" onClick={() => setSelectedIds([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>ล้างที่เลือก</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem', minHeight: '220px', maxHeight: '380px', paddingRight: '0.25rem' }}>
              {loadingEvents ? (
                <div className="flex-center" style={{ height: '200px', color: 'var(--text-secondary)' }}>กำลังดึงนัดหมายจาก Outlook Calendar...</div>
              ) : events.length === 0 ? (
                <div className="flex-center" style={{ height: '200px', color: 'var(--text-muted)' }}>ไม่พบนัดหมายในช่วงวันที่ที่เลือก</div>
              ) : (
                events.map(evt => (
                  <OutlookEventRow
                    key={evt.outlookEventId}
                    event={evt}
                    selected={selectedIds.includes(evt.outlookEventId)}
                    hours={hoursOverrides[evt.outlookEventId] ?? evt.estimatedHours}
                    projectName={getProjectName(evt.existingProjectId)}
                    onToggleSelect={toggleSelect}
                    onChangeHours={setEventHours}
                  />
                ))
              )}
            </div>
          </>
        )}

        {errorMessage && <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.15)', color: '#ff6b6b', fontSize: '0.82rem' }}>⚠️ {errorMessage}</div>}
        {successMessage && <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.82rem' }}>✅ {successMessage}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Close</button>
          {status.connected && (
            <button
              onClick={() => void submitImport()}
              disabled={submitting || selectedIds.length === 0}
              style={{
                padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-md)', border: 'none',
                background: 'var(--accent-primary)', color: 'white', fontWeight: 600,
                cursor: submitting || selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: submitting || selectedIds.length === 0 ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '0.45rem',
              }}
            >
              <CheckSquare size={16} />
              {submitting ? 'Importing...' : `Import / Sync Selected (${selectedIds.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
