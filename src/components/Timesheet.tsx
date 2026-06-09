import { useState } from 'react';
import { mockTimesheets, mockProjects, mockTasks, mockUsers } from '../data/mockData';
import { Clock, Plus, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

export const Timesheet = () => {
  const currentUser = mockUsers[0];
  const [selectedDate, setSelectedDate] = useState(new Date('2026-06-09'));

  // Generate a mock week starting from 3 days ago to 3 days ahead
  const weekDays = Array.from({ length: 7 }).map((_, i) => subDays(selectedDate, 3 - i));

  const todaysEntries = mockTimesheets.filter(ts => ts.userId === currentUser.id && isSameDay(new Date(ts.date), selectedDate));
  const totalHoursToday = todaysEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || 'Unknown Project';
  const getTaskName = (id?: string) => id ? (mockTasks.find(t => t.id === id)?.title || 'Unknown Task') : 'General';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Timesheet</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log your hours and track your daily activities.</p>
        </div>
        <button style={{ 
          background: 'var(--accent-primary)', 
          color: 'white', 
          border: 'none', 
          padding: '0.75rem 1.5rem', 
          borderRadius: 'var(--radius-md)', 
          fontWeight: 500, 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }} className="hover-lift">
          <Plus size={18} /> Log Time
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* Left Column: Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Week Navigation */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {weekDays.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(date)}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-primary)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  className={!isSelected ? "hover-lift" : ""}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{format(date, 'EEE')}</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{format(date, 'dd')}</span>
                </div>
              );
            })}
          </div>

          {/* Daily Entries */}
          <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Entries for {format(selectedDate, 'MMMM d, yyyy')}</h3>
              <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{totalHoursToday} Hours Total</div>
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
              <CalendarIcon size={18} /> Weekly Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Total Logged</span>
                <span style={{ fontWeight: 600 }}>26h</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Target</span>
                <span style={{ fontWeight: 600 }}>40h</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginTop: '0.5rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '65%', background: 'var(--accent-secondary)' }} />
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
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>14h Approved</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This week</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', borderRadius: '50%' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>12h Pending</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting PM approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
