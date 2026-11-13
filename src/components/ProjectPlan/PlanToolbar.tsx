import React from 'react';
import { GitCompare, Plus, Save, Search, Zap } from 'lucide-react';
import type { Project } from '../../types';
import type { Baseline } from './planUtils';
import {
  planPrimaryBtnStyle,
  planSecondaryBtnStyle,
  planSelectCompactStyle,
} from './planStyles';

interface PlanToolbarProps {
  visibleProjects: Project[];
  selectedProjectId: string;
  selectedProject: Project | undefined;
  onSelectProject: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  baselines: Baseline[];
  activeBaselineId: string;
  compareBaselineId: string;
  activatingBaseline: boolean;
  isGenerating: boolean;
  canCreate: boolean;
  canEdit: boolean;
  onActivateBaseline: (baselineId: string) => void;
  onChangeCompareBaseline: (baselineId: string) => void;
  onOpenSaveBaseline: () => void;
  onGenerateFromTemplates: () => void;
  onOpenAddMilestone: () => void;
}

const toolbarInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-13)',
  padding: '8px 12px',
  outline: 'none',
};

export const PlanToolbar: React.FC<PlanToolbarProps> = ({
  visibleProjects,
  selectedProjectId,
  selectedProject,
  onSelectProject,
  searchQuery,
  onSearchChange,
  baselines,
  activeBaselineId,
  compareBaselineId,
  activatingBaseline,
  isGenerating,
  canCreate,
  canEdit,
  onActivateBaseline,
  onChangeCompareBaseline,
  onOpenSaveBaseline,
  onGenerateFromTemplates,
  onOpenAddMilestone,
}) => {
  const isAllProjects = selectedProjectId === 'all';
  const isSupport = selectedProject?.projectType === 'support';

  return (
    <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: '1 1 320px' }}>
          <select
            aria-label="Filter by project"
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            style={{ ...toolbarInputStyle, minWidth: '200px', fontWeight: 500 }}
          >
            {visibleProjects.length > 1 && <option value="all">All Projects</option>}
            {visibleProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search milestones or subtasks..."
              style={{ ...toolbarInputStyle, width: '100%', paddingLeft: '32px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {!isAllProjects && !isSupport && canEdit && (
            <>
              <button type="button" onClick={onOpenSaveBaseline} style={planSecondaryBtnStyle}>
                <Save size={14} /> Save Version
              </button>
              <button
                type="button"
                onClick={onGenerateFromTemplates}
                disabled={isGenerating}
                style={{ ...planSecondaryBtnStyle, cursor: isGenerating ? 'wait' : 'pointer', opacity: isGenerating ? 0.6 : 1 }}
              >
                <Zap size={14} /> {isGenerating ? 'Generating...' : 'Generate Templates'}
              </button>
            </>
          )}

          {!isSupport && canCreate && (
            <button type="button" onClick={onOpenAddMilestone} style={planPrimaryBtnStyle}>
              <Plus size={14} /> Add Milestone
            </button>
          )}
        </div>
      </div>

      {!isAllProjects && !isSupport && baselines.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', fontWeight: 500 }}>Active Baseline:</span>
            <select
              aria-label="Active baseline"
              value={activeBaselineId}
              onChange={(e) => onActivateBaseline(e.target.value)}
              disabled={activatingBaseline || !canEdit}
              style={{ ...planSelectCompactStyle, fontWeight: 500 }}
            >
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>{b.name} {b.isActive ? '(Active)' : ''}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCompare size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', fontWeight: 500 }}>Compare With:</span>
            <select
              aria-label="Compare baseline"
              value={compareBaselineId}
              onChange={(e) => onChangeCompareBaseline(e.target.value)}
              style={planSelectCompactStyle}
            >
              <option value="live">Current Live Plan</option>
              {baselines.filter((b) => b.id !== activeBaselineId).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
