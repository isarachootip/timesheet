import { useState } from 'react';
import { mockUsers, mockTimesheets, mockProjects, mockTasks } from '../data/mockData';
import type { TimesheetEntry } from '../types';
import { Check, X, Shield, Clock, Award, Users } from 'lucide-react';

export const TeamApprovals = () => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(mockTimesheets);
  const [activeTab, setActiveTab] = useState<'team' | 'approvals'>('team');

  // Filter pending timesheets
  const pendingEntries = timesheets.filter(ts => ts.status === 'Pending');

  const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || 'Unknown Project';
  const getTaskName = (id?: string) => id ? (mockTasks.find(t => t.id === id)?.title || 'Unknown Task') : 'General';
  const getUserName = (id: string) => mockUsers.find(u => u.id === id)?.name || 'Unknown User';
  const getUserAvatar = (id: string) => mockUsers.find(u => u.id === id)?.avatar || '';

  const handleApprove = (id: string) => {
    setTimesheets(prev => prev.map(ts => ts.id === id ? { ...ts, status: 'Approved', approvedBy: 'u1', approvedAt: new Date().toISOString() } : ts));
  };

  const handleReject = (id: string) => {
    setTimesheets(prev => prev.map(ts => ts.id === id ? { ...ts, status: 'Rejected' } : ts));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Team & Approvals</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage team members and approve timesheet submissions.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('team')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'team' ? 'var(--text-primary)' : 'var(--text-muted)',
            paddingBottom: '0.75rem',
            borderBottom: activeTab === 'team' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} /> Team Directory
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('approvals')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'approvals' ? 'var(--text-primary)' : 'var(--text-muted)',
            paddingBottom: '0.75rem',
            borderBottom: activeTab === 'approvals' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Pending Approvals 
            {pendingEntries.length > 0 && (
              <span style={{ fontSize: '0.75rem', background: 'var(--accent-danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}>
                {pendingEntries.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'team' ? (
        /* Team Directory */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {mockUsers.map(user => (
            <div key={user.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={user.avatar} alt={user.name} style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{user.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Shield size={12} color="var(--accent-primary)" />
                  <span>{user.globalRole} • {user.department}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {user.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Approvals Queue */
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Pending Timesheet Submissions</h3>
          
          {pendingEntries.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', height: '200px' }}>
              <Award size={48} opacity={0.3} />
              <p>All timesheets have been processed. Great job!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingEntries.map(entry => (
                <div key={entry.id} style={{ 
                  padding: '1.25rem', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: '4px solid var(--accent-warning)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={getUserAvatar(entry.userId)} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{getUserName(entry.userId)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.date}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{getProjectName(entry.projectId)}</span> ({getTaskName(entry.taskId)}): {entry.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginRight: '1rem' }}>{entry.hours}h</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleApprove(entry.id)}
                        style={{ 
                          background: 'rgba(16, 185, 129, 0.2)', 
                          color: 'var(--accent-secondary)', 
                          border: 'none', 
                          padding: '0.5rem', 
                          borderRadius: 'var(--radius-md)', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        className="hover-lift"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleReject(entry.id)}
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.2)', 
                          color: 'var(--accent-danger)', 
                          border: 'none', 
                          padding: '0.5rem', 
                          borderRadius: 'var(--radius-md)', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        className="hover-lift"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
