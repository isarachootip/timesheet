import { useState } from 'react';
import type { TaskTemplate, TaskPriority } from '../types';
import { Plus, Trash2, Edit, X, Save } from 'lucide-react';

interface SettingsProps {
  taskTemplates: TaskTemplate[];
  setTaskTemplates: React.Dispatch<React.SetStateAction<TaskTemplate[]>>;
}

export const Settings = ({ taskTemplates, setTaskTemplates }: SettingsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'integrations'>('templates');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [startPercent, setStartPercent] = useState('0');
  const [endPercent, setEndPercent] = useState('100');
  const [estimatedHours, setEstimatedHours] = useState('8');

  const openAddModal = () => {
    setEditingTemplate(null);
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setStartPercent('0');
    setEndPercent('10');
    setEstimatedHours('8');
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: TaskTemplate) => {
    setEditingTemplate(tpl);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setPriority(tpl.priority);
    setStartPercent(String(tpl.startPercent));
    setEndPercent(String(tpl.endPercent));
    setEstimatedHours(String(tpl.estimatedHours));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Title is required');

    const startVal = Math.max(0, Math.min(100, Number(startPercent) || 0));
    const endVal = Math.max(startVal, Math.min(100, Number(endPercent) || 100));

    if (startVal >= endVal) {
      return alert('Start percent must be strictly less than end percent.');
    }

    const tplData: TaskTemplate = {
      id: editingTemplate ? editingTemplate.id : 'tpl_' + Date.now(),
      title,
      description,
      priority,
      startPercent: startVal,
      endPercent: endVal,
      estimatedHours: Number(estimatedHours) || 0
    };

    if (editingTemplate) {
      setTaskTemplates(prev => prev.map(t => t.id === editingTemplate.id ? tplData : t));
    } else {
      setTaskTemplates(prev => [...prev, tplData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task template? Newly created projects will not generate this task.')) {
      setTaskTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const getPriorityBadgeColor = (prio: TaskPriority) => {
    switch (prio) {
      case 'Urgent': return 'var(--accent-danger)';
      case 'High': return 'var(--accent-warning)';
      case 'Medium': return 'var(--accent-info)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      {/* Top Bar */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>System Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure default milestones and main task templates for automatic project plan generation.</p>
        </div>
        {activeTab === 'templates' && (
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
            <Plus size={18} /> Add Milestone Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('templates')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'templates' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'templates' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeTab === 'templates' ? 600 : 400
          }}
        >
          Milestone Templates
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'integrations' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'integrations' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeTab === 'integrations' ? 600 : 400
          }}
        >
          Git Webhook Integrations
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Visual Timeline Preview */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Visual Proportional Timeline Preview (0% - 100% of Project Duration)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Below is a visual projection showing how the tasks will span across your project timeline, based on their Start % and End %.
            </p>

            {/* Timeline representation */}
            <div style={{ 
              position: 'relative', 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              minHeight: '260px', 
              padding: '1rem 0'
            }}>
              {/* Vertical axis ticks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem', margin: '0 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Start (0%)</span>
                <span>25%</span>
                <span>50% (Midpoint)</span>
                <span>75%</span>
                <span>End (100%)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', padding: '0 1rem' }}>
                {taskTemplates.map((tpl, idx) => {
                  const widthVal = tpl.endPercent - tpl.startPercent;
                  return (
                    <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', height: '24px', position: 'relative' }}>
                      {/* Left Label */}
                      <span style={{ fontSize: '0.7rem', width: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                        {tpl.title}
                      </span>
                      
                      {/* Bar container */}
                      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                        <div style={{
                          position: 'absolute',
                          left: `${tpl.startPercent}%`,
                          width: `${widthVal}%`,
                          height: '14px',
                          background: idx % 2 === 0 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                          border: idx % 2 === 0 ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(168, 85, 247, 0.5)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '4px',
                          fontSize: '0.65rem',
                          color: 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }} title={`${tpl.title}: ${tpl.startPercent}% to ${tpl.endPercent}% (${tpl.estimatedHours}h)`}>
                          {tpl.startPercent}% - {tpl.endPercent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid of Milestone Templates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {taskTemplates.map(tpl => (
              <div key={tpl.id} className="glass-panel hover-lift" style={{ padding: '1.25rem', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex-between">
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 600, 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: 'var(--radius-sm)', 
                    background: getPriorityBadgeColor(tpl.priority),
                    color: 'white'
                  }}>
                    {tpl.priority}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditModal(tpl)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(tpl.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{tpl.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minHeight: '40px' }}>{tpl.description}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Phase: <strong>{tpl.startPercent}% - {tpl.endPercent}%</strong></span>
                  <span>Default Est: <strong>{tpl.estimatedHours} hrs</strong></span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>GitHub Webhook Setup</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Automatically update task statuses when you push code to GitHub.
            </p>
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payload URL:</span>
              <code style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', wordBreak: 'break-all' }}>
                {window.location.origin}/api/webhooks/github
              </code>
            </div>
            <ol style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Go to your GitHub repository <strong>Settings</strong> &gt; <strong>Webhooks</strong> &gt; <strong>Add webhook</strong>.</li>
              <li>Set <strong>Payload URL</strong> to the link above.</li>
              <li>Set Content type to <strong>application/json</strong>.</li>
              <li>Choose <strong>Just the push event</strong> and click <strong>Add webhook</strong>.</li>
            </ol>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>GitLab Webhook Setup</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Automatically update task statuses when you push code to GitLab.
            </p>
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>URL:</span>
              <code style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', wordBreak: 'break-all' }}>
                {window.location.origin}/api/webhooks/gitlab
              </code>
            </div>
            <ol style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Go to your GitLab project <strong>Settings</strong> &gt; <strong>Webhooks</strong>.</li>
              <li>Add the URL above.</li>
              <li>Select <strong>Push events</strong> trigger and click <strong>Add webhook</strong>.</li>
            </ol>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Commit Message Format Guide</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              NexTime scans your commit messages for Task IDs (e.g. <code>[t1]</code> or <code>#t1</code>) and transitions them based on keywords.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <th style={{ padding: '0.5rem 0' }}>Keywords</th>
                  <th style={{ padding: '0.5rem 0' }}>Target Status</th>
                  <th style={{ padding: '0.5rem 0' }}>Example Commit Message</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem 0' }}><code>fix</code>, <code>close</code>, <code>resolve</code>, <code>complete</code>, <code>done</code>, <code>แก้</code>, <code>ปิด</code></td>
                  <td style={{ padding: '0.5rem 0' }}><span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Done</span> (Last Column)</td>
                  <td style={{ padding: '0.5rem 0' }}><code>[t123] fix styling bug on dashboard</code></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem 0' }}><code>work</code>, <code>progress</code>, <code>develop</code>, <code>start</code>, <code>ทำ</code>, <code>เริ่ม</code></td>
                  <td style={{ padding: '0.5rem 0' }}><span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>In Progress</span></td>
                  <td style={{ padding: '0.5rem 0' }}><code>#t456 start database indexing setup</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
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
              <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>{editingTemplate ? 'Edit Milestone Template' : 'Add New Milestone Template'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Milestone Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="e.g. UX/UI Interface Design"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none', minHeight: '60px', resize: 'vertical' }}
                  placeholder="Brief summary of milestone outcomes..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Default Est. Hours</label>
                  <input 
                    type="number" 
                    value={estimatedHours} 
                    onChange={e => setEstimatedHours(e.target.value)} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Timeline Start Percent (0 - 100%) *</label>
                  <input 
                    type="number" 
                    value={startPercent} 
                    onChange={e => setStartPercent(e.target.value)} 
                    min="0"
                    max="99"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Timeline End Percent (0 - 100%) *</label>
                  <input 
                    type="number" 
                    value={endPercent} 
                    onChange={e => setEndPercent(e.target.value)} 
                    min="1"
                    max="100"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                    required
                  />
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
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }} className="hover-lift">
                <Save size={18} /> Save Template
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
