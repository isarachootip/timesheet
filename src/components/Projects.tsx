import { useState } from 'react';
import { Calendar, Users, DollarSign, Plus, X, Edit, Trash2 } from 'lucide-react';
import type { User, Project, ProjectStatus, ProjectRole, Task } from '../types';

interface ProjectsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  users: User[];
  tasks?: Task[];
}

export const Projects = ({ projects, setProjects, users, tasks }: ProjectsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [members, setMembers] = useState<{ userId: string; role: ProjectRole }[]>([]);

  // Member select helper state
  const [tempUserId, setTempUserId] = useState('');
  const [tempRole, setTempRole] = useState<ProjectRole>('Frontend dev');
  const [customRole, setCustomRole] = useState('');

  const formatNumberWithCommas = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseNumberFromCommas = (formattedValue: string) => {
    return parseFloat(formattedValue.replace(/,/g, '')) || 0;
  };

  const openAddModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setStatus('Planning');
    setStartDate('');
    setEndDate('');
    setBudget('');
    setMembers([]);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
    setStartDate(project.startDate);
    setEndDate(project.endDate || '');
    setBudget(project.budget ? formatNumberWithCommas(String(project.budget)) : '');
    setMembers(project.members);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate) return alert('Name and Start Date are required');

    const projectData: Project = {
      id: editingProject ? editingProject.id : 'p_' + Date.now(),
      name,
      description,
      status,
      startDate,
      endDate: endDate || undefined,
      budget: budget ? parseNumberFromCommas(budget) : undefined,
      members
    };

    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? projectData : p));
    } else {
      setProjects(prev => [...prev, projectData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const addMember = () => {
    if (!tempUserId) return alert('Select a user first');
    if (members.some(m => m.userId === tempUserId)) return alert('Member already added');
    const roleToAdd = tempRole === 'Custom' ? customRole : tempRole;
    if (!roleToAdd) return alert('Please enter or select a role');
    setMembers(prev => [...prev, { userId: tempUserId, role: roleToAdd }]);
    setTempUserId('');
    setCustomRole('');
  };

  const removeMember = (userId: string) => {
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const getUserAvatar = (userId: string) => users.find(u => u.id === userId)?.avatar || '';
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your active projects and team assignments.</p>
        </div>
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
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {projects.map(project => (
          <div key={project.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{project.name}</h3>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: 'var(--radius-full)', 
                  background: project.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: project.status === 'Active' ? 'var(--accent-secondary)' : 'var(--accent-warning)',
                  fontWeight: 500
                }}>
                  {project.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEditModal(project)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(project.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {project.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Calendar size={16} />
                <span>{new Date(project.startDate).toLocaleDateString()} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</span>
              </div>
              {project.budget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <DollarSign size={16} />
                  <span>${project.budget.toLocaleString()} Budget</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} /> Team ({project.members.length})
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {project.members.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No members added yet</span>
                ) : (
                  project.members.map((member, index) => (
                    <img 
                      key={member.userId} 
                      src={getUserAvatar(member.userId)} 
                      alt="Team member" 
                      title={`${getUserName(member.userId)} (${member.role})`}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        border: '2px solid var(--bg-tertiary)',
                        marginLeft: index > 0 ? '-10px' : '0',
                        zIndex: project.members.length - index
                      }} 
                    />
                  ))
                )}
              </div>
            </div>

            {/* Collapsible Project Milestones Checklist */}
            {(() => {
              const projectTasks = tasks ? tasks.filter(t => t.projectId === project.id && !t.parentId) : [];
              if (projectTasks.length === 0) return null;
              return (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <details style={{ cursor: 'pointer' }}>
                    <summary style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 500, outline: 'none' }}>
                      📅 Auto-Generated Plan ({projectTasks.length} Milestones)
                    </summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {projectTasks.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={t.title}>
                            {t.title}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {t.startDate ? `${new Date(t.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${t.endDate ? new Date(t.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : ''}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
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
          <div className="glass-panel" style={{ padding: '2rem', width: '650px', maxWidth: '95%', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between">
              <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>{editingProject ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Project Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as ProjectStatus)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Budget ($)</label>
                  <input 
                    type="text" 
                    value={budget} 
                    onChange={e => setBudget(formatNumberWithCommas(e.target.value))} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Start Date *</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Members Setup */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem' }}>Manage Members</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={tempUserId} 
                    onChange={e => setTempUserId(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">Select Employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                  </select>

                  <select 
                    value={tempRole} 
                    onChange={e => setTempRole(e.target.value)}
                    style={{ width: '130px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Frontend dev">Frontend dev</option>
                    <option value="Backend dev">Backend dev</option>
                    <option value="PM">PM</option>
                    <option value="SA">SA</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="DevOps">DevOps</option>
                    <option value="QC">QC</option>
                    <option value="Designer">Designer</option>
                    <option value="Custom">Custom Role...</option>
                  </select>

                  {tempRole === 'Custom' && (
                    <input 
                      type="text" 
                      placeholder="Type role..."
                      value={customRole}
                      onChange={e => setCustomRole(e.target.value)}
                      style={{ flex: 1, minWidth: '80px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  )}

                  <button type="button" onClick={addMember} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {members.map(m => (
                    <div key={m.userId} className="flex-between" style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.85rem' }}>{getUserName(m.userId)} - <span style={{ color: 'var(--text-muted)' }}>{m.role}</span></span>
                      <button type="button" onClick={() => removeMember(m.userId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
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
                Save Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
