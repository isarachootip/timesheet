
import { mockProjects, mockUsers } from '../data/mockData';
import { Calendar, Users, DollarSign, ChevronRight, Plus } from 'lucide-react';

export const Projects = () => {
  const getAvatar = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.avatar || '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your active projects and team assignments.</p>
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
          <Plus size={18} /> New Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {mockProjects.map(project => (
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
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <ChevronRight size={20} />
              </button>
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
                {project.members.map((member, index) => (
                  <img 
                    key={member.userId} 
                    src={getAvatar(member.userId)} 
                    alt="Team member" 
                    title={`${member.role}`}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      border: '2px solid var(--bg-tertiary)',
                      marginLeft: index > 0 ? '-10px' : '0',
                      zIndex: project.members.length - index
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
