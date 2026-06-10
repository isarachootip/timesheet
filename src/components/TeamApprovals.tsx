import { useState } from 'react';
import type { TimesheetEntry, User, GlobalRole, Project, ProjectRole } from '../types';
import { Check, X, Shield, Clock, Award, Users, Plus, Edit, Trash2 } from 'lucide-react';

interface TeamApprovalsProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  timesheets: TimesheetEntry[];
  setTimesheets: React.Dispatch<React.SetStateAction<TimesheetEntry[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: any[];
}

export const TeamApprovals = ({ users, setUsers, timesheets, setTimesheets, projects, setProjects, tasks }: TeamApprovalsProps) => {
  const [activeTab, setActiveTab] = useState<'team' | 'approvals'>('team');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // User form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [globalRole, setGlobalRole] = useState<GlobalRole>('Employee');
  const [department, setDepartment] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectRole, setProjectRole] = useState<ProjectRole>('Frontend dev');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [birthday, setBirthday] = useState('');
  const [skills, setSkills] = useState('');
  const [avatar, setAvatar] = useState('');

  // Filter pending timesheets
  const pendingEntries = timesheets.filter(ts => ts.status === 'Pending');

  const calculateAge = (birthdayStr?: string) => {
    if (!birthdayStr) return null;
    const birthDate = new Date(birthdayStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown Project';
  const getTaskName = (id?: string) => id ? (tasks.find(t => t.id === id)?.title || 'Unknown Task') : 'General';
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown User';
  const getUserAvatar = (id: string) => users.find(u => u.id === id)?.avatar || '';

  const handleApprove = (id: string) => {
    setTimesheets(prev => prev.map(ts => ts.id === id ? { ...ts, status: 'Approved', approvedBy: 'u1', approvedAt: new Date().toISOString() } : ts));
  };

  const handleReject = (id: string) => {
    setTimesheets(prev => prev.map(ts => ts.id === id ? { ...ts, status: 'Rejected' } : ts));
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setGlobalRole('Employee');
    setDepartment('');
    setSelectedProjectId('');
    setProjectRole('Frontend dev');
    setGender('');
    setBirthday('');
    setSkills('');
    setAvatar('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setGlobalRole(user.globalRole);
    setDepartment(user.department);
    setGender(user.gender || '');
    setBirthday(user.birthday || '');
    setSkills(user.skills ? user.skills.join(', ') : '');
    setAvatar(user.avatar || '');
    
    // Find current project membership
    const currentProj = projects.find(p => p.members && p.members.some(m => m.userId === user.id));
    if (currentProj) {
      setSelectedProjectId(currentProj.id);
      const member = currentProj.members.find(m => m.userId === user.id);
      setProjectRole(member ? member.role : 'Frontend dev');
    } else {
      setSelectedProjectId('');
      setProjectRole('Frontend dev');
    }
    
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return alert('Name and Email are required');

    const userId = editingUser ? editingUser.id : 'u_' + Date.now();
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    const userData: User = {
      id: userId,
      name,
      email,
      globalRole,
      department,
      gender,
      birthday,
      skills: skillsArray,
      avatar: avatar || `https://i.pravatar.cc/150?u=${userId}`
    };

    // 1. Update users list
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? userData : u));
    } else {
      setUsers(prev => [...prev, userData]);
    }

    // 2. Update projects membership
    setProjects(prevProjects => {
      return prevProjects.map(proj => {
        // Remove user from this project if it's not the selected one
        if (proj.id !== selectedProjectId) {
          return {
            ...proj,
            members: proj.members ? proj.members.filter(m => m.userId !== userId) : []
          };
        }
        
        // If it is the selected project, add/update the user membership
        const membersList = proj.members || [];
        const isAlreadyMember = membersList.some(m => m.userId === userId);
        
        if (isAlreadyMember) {
          return {
            ...proj,
            members: membersList.map(m => m.userId === userId ? { ...m, role: projectRole } : m)
          };
        } else {
          return {
            ...proj,
            members: [...membersList, { userId, role: projectRole }]
          };
        }
      });
    });

    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Team & Approvals</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage team members and approve timesheet submissions.</p>
        </div>
        {activeTab === 'team' && (
          <button onClick={openAddModal} style={{ 
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
            <Plus size={18} /> Add Employee
          </button>
        )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {users.map(user => {
            const userProjectRoles = projects
              .filter(p => p.members && p.members.some((m: any) => m.userId === user.id))
              .map(p => {
                const member = p.members.find((m: any) => m.userId === user.id);
                return { projectName: p.name, role: member ? member.role : '' };
              });

             return (
              <div key={user.id} className="glass-panel hover-lift team-member-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div className="member-card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={user.avatar} alt={user.name} style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
                  <div className="member-info" style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{user.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <Shield size={12} color="var(--accent-primary)" />
                      <span>{user.globalRole} • {user.department}</span>
                    </div>
                    
                    {(user.gender || user.birthday) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {user.gender && <span>{user.gender}</span>}
                        {user.gender && user.birthday && <span> • </span>}
                        {user.birthday && (
                          <span>
                            {user.birthday} ({calculateAge(user.birthday)} yrs)
                          </span>
                        )}
                      </div>
                    )}

                    <div className="member-email" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                      {user.email}
                    </div>

                    {user.skills && user.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                        {user.skills.map((skill, idx) => (
                          <span key={idx} style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.4rem', 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-secondary)', 
                            borderRadius: 'var(--radius-sm)' 
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="member-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button onClick={() => openEditModal(user)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Display Project Specific Roles */}
                {userProjectRoles.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Project Roles:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {userProjectRoles.map((pr, idx) => (
                        <span key={idx} style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.2rem 0.5rem', 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: 'var(--accent-primary)', 
                          borderRadius: 'var(--radius-sm)' 
                        }}>
                          {pr.projectName} ({pr.role})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* User Add/Edit Modal */}
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
          zIndex: 99
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '550px', maxWidth: '95%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
              <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>{editingUser ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Department</label>
                <input 
                  type="text" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Role</label>
                <select 
                  value={globalRole} 
                  onChange={e => setGlobalRole(e.target.value as GlobalRole)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Project Assignment</label>
                <select 
                  value={selectedProjectId} 
                  onChange={e => setSelectedProjectId(e.target.value)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="">None</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gender</label>
                  <select 
                    value={gender} 
                    onChange={e => setGender(e.target.value as any)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">Unspecified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Birthday</label>
                  <input 
                    type="date" 
                    value={birthday} 
                    onChange={e => setBirthday(e.target.value)} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.45rem 0.75rem', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Skills (Comma-separated)</label>
                <input 
                  type="text" 
                  value={skills} 
                  placeholder="e.g. React, TypeScript, Node.js"
                  onChange={e => setSkills(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Profile Picture</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {avatar ? (
                    <img src={avatar} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed var(--border-color)' }}>No Pic</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label style={{ 
                        flex: 1,
                        background: 'var(--bg-tertiary)', 
                        border: '1px solid var(--border-color)', 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        fontSize: '0.75rem', 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        display: 'block'
                      }} className="hover-lift">
                        📁 Choose Photo
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      
                      <label style={{ 
                        flex: 1,
                        background: 'var(--accent-primary)', 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        fontSize: '0.75rem', 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        color: 'white',
                        display: 'block'
                      }} className="hover-lift">
                        📸 Take Photo
                        <input 
                          type="file" 
                          accept="image/*"
                          capture="user"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <input 
                      type="text" 
                      value={avatar} 
                      placeholder="Or paste Image URL"
                      onChange={e => setAvatar(e.target.value)} 
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.35rem 0.75rem', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>

              {selectedProjectId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Role in Project</label>
                  <select 
                    value={projectRole} 
                    onChange={e => setProjectRole(e.target.value as ProjectRole)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="PM">PM</option>
                    <option value="SA">SA</option>
                    <option value="Frontend dev">Frontend dev</option>
                    <option value="Backend dev">Backend dev</option>
                    <option value="QC">QC</option>
                    <option value="Designer">Designer</option>
                  </select>
                </div>
              )}

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
                Save Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
