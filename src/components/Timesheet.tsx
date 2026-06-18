import { useState } from 'react';
import { Clock, Plus, CheckCircle2, Calendar as CalendarIcon, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth } from 'date-fns';
import type { TimesheetEntry, Project, Task, User, TimesheetStatus } from '../types';

interface TimesheetProps {
  timesheets: TimesheetEntry[];
  setTimesheets: React.Dispatch<React.SetStateAction<TimesheetEntry[]>>;
  projects: Project[];
  tasks: Task[];
  currentUser: User;
}

export const Timesheet = ({ timesheets, setTimesheets, projects, tasks, currentUser }: TimesheetProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [entryStatus, setEntryStatus] = useState<TimesheetStatus>('Pending');

  // Filter project-specific tasks
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  // Generate calendar grid for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Filter entries
  const userEntries = timesheets.filter(ts => ts.userId === currentUser.id);
  const todaysEntries = userEntries.filter(ts => isSameDay(new Date(ts.date), selectedDate));
  const totalHoursToday = todaysEntries.reduce((sum, entry) => sum + entry.hours, 0);

  // Monthly stats (instead of weekly)
  const thisMonthEntries = userEntries.filter(ts => {
    const entryDate = new Date(ts.date);
    return isSameMonth(entryDate, currentMonth);
  });
  const monthlyHours = thisMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = thisMonthEntries.filter(ts => ts.status === 'Approved').reduce((sum, entry) => sum + entry.hours, 0);
  const pendingHours = thisMonthEntries.filter(ts => ts.status === 'Pending').reduce((sum, entry) => sum + entry.hours, 0);

  // Check if a date has entries (for dot indicator)
  const dateHasEntries = (d: Date) => userEntries.some(ts => isSameDay(new Date(ts.date), d));

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown Project';
  const getTaskName = (id?: string) => id ? (tasks.find(t => t.id === id)?.title || 'Unknown Task') : 'General';

  const openLogModal = () => {
    setProjectId(projects[0]?.id || '');
    setTaskId('');
    setHours('');
    setDescription('');
    setEntryStatus('Pending');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !hours || !description) return alert('Project, Hours, and Description are required');

    const newEntry: TimesheetEntry = {
      id: 'ts_' + Date.now(),
      userId: currentUser.id,
      projectId,
      taskId: taskId || undefined,
      date: format(selectedDate, 'yyyy-MM-dd'),
      hours: Number(hours),
      description,
      status: entryStatus
    };

    setTimesheets(prev => [...prev, newEntry]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this log entry?')) {
      setTimesheets(prev => prev.filter(ts => ts.id !== id));
    }
  };

  const handleDateClick = (d: Date) => {
    setSelectedDate(d);
    if (!isSameMonth(d, currentMonth)) {
      setCurrentMonth(d);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Timesheet</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Log your hours and track your daily activities.</p>
      </div>

      <div className="timesheet-row" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* Left Column: Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Mini Monthly Calendar */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
            {/* Month Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} className="hover-lift">
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{format(currentMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} className="hover-lift">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day Names Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.25rem' }}>
              {dayNames.map(dn => (
                <div key={dn} style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.25rem 0' }}>{dn}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {calendarDays.map((d, i) => {
                const isSelected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, new Date());
                const isCurrentMonth = isSameMonth(d, currentMonth);
                const hasEntries = dateHasEntries(d);

                return (
                  <div
                    key={i}
                    onClick={() => handleDateClick(d)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.3rem 0',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-primary)' : isToday ? 'rgba(0, 206, 209, 0.15)' : 'transparent',
                      color: isSelected ? 'white' : !isCurrentMonth ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      fontSize: '0.8rem',
                      fontWeight: isSelected || isToday ? 700 : 400,
                      position: 'relative',
                      opacity: isCurrentMonth ? 1 : 0.4,
                      border: isToday && !isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      minHeight: '32px'
                    }}
                  >
                    {format(d, 'd')}
                    {hasEntries && (
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: isSelected ? 'white' : 'var(--accent-secondary)',
                        marginTop: '1px'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today Button */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button 
                onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date()); }} 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--accent-primary)', 
                  padding: '0.3rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }} 
                className="hover-lift"
              >
                Today
              </button>
            </div>
          </div>

          {/* Daily Entries */}
          <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Entries for {format(selectedDate, 'MMMM d, yyyy')}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{totalHoursToday} Hours Total</div>
                <button onClick={openLogModal} style={{ 
                  background: 'var(--accent-primary)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.5rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontWeight: 500, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem'
                }} className="hover-lift">
                  <Plus size={16} /> Log Time
                </button>
              </div>
            </div>

            {todaysEntries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', height: '200px' }}>
                <Clock size={48} opacity={0.3} />
                <p>No time logged for this date.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {todaysEntries.map(entry => (
                  <div key={entry.id} style={{ 
                    padding: '1.25rem', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    borderLeft: '4px solid var(--accent-primary)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getProjectName(entry.projectId)}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                          {getTaskName(entry.taskId)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{entry.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{entry.hours}h</div>
                        {entry.status === 'Approved' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-secondary)', fontSize: '0.75rem' }}>
                            <CheckCircle2 size={14} /> Approved
                          </div>
                        ) : entry.status === 'Pending' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-warning)', fontSize: '0.75rem' }}>
                            <Clock size={14} /> Pending
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Draft
                          </div>
                        )}
                      </div>
                      {entry.status !== 'Approved' && (
                        <button onClick={() => handleDelete(entry.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', marginLeft: '0.5rem' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Summary or Quick Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} /> Monthly Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Total Logged</span>
                <span style={{ fontWeight: 600 }}>{monthlyHours}h</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Target</span>
                <span style={{ fontWeight: 600 }}>160h</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginTop: '0.5rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (monthlyHours / 160) * 100)}%`, background: 'var(--accent-secondary)' }} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Approval Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-secondary)', borderRadius: '50%' }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{approvedHours}h Approved</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This month</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', borderRadius: '50%' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{pendingHours}h Pending</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting PM approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Time Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '650px', maxWidth: '95%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
              <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>Log Work Time</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Project *</label>
                <select 
                  value={projectId} 
                  onChange={e => { setProjectId(e.target.value); setTaskId(''); }}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Task</label>
                <select 
                  value={taskId} 
                  onChange={e => setTaskId(e.target.value)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  disabled={!projectId}
                >
                  <option value="">General Work / No Task</option>
                  {projectTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hours Spent *</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours} 
                  onChange={e => setHours(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description / Activity *</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none', minHeight: '60px', resize: 'vertical' }}
                  placeholder="What did you work on?"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Submission Status</label>
                <select 
                  value={entryStatus} 
                  onChange={e => setEntryStatus(e.target.value as TimesheetStatus)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="Pending">Submit for Approval (Pending)</option>
                  <option value="Draft">Save as Draft (Draft)</option>
                </select>
              </div>

              <button type="submit" style={{ 
                background: 'var(--accent-primary)', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)', 
                fontWeight: 600, 
                cursor: 'pointer',
                marginTop: '1rem'
              }} className="hover-lift">
                Log Time Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
