import React from 'react';
import { Search } from 'lucide-react';
import type { NoteCategoryFilter } from './noteUtils';

interface NotesControlBarProps {
  filter: 'all' | 'active' | 'completed';
  onChangeFilter: (next: 'all' | 'active' | 'completed') => void;
  categoryFilter: NoteCategoryFilter;
  onChangeCategoryFilter: (next: NoteCategoryFilter) => void;
  search: string;
  onChangeSearch: (next: string) => void;
  stats: { total: number; active: number; completed: number };
}

export const NotesControlBar: React.FC<NotesControlBarProps> = ({
  filter,
  onChangeFilter,
  categoryFilter,
  onChangeCategoryFilter,
  search,
  onChangeSearch,
  stats,
}) => (
  <div className="glass-panel" style={{ padding: '0.75rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px' }}>
        {(['all', 'active', 'completed'] as const).map((tab) => {
          const isActive = filter === tab;
          const labels = {
            all: `ทั้งหมด (${stats.total})`,
            active: `รอดำเนินการ (${stats.active})`,
            completed: `เสร็จสิ้น (${stats.completed})`,
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChangeFilter(tab)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '5px', border: 'none',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)', cursor: 'pointer',
                fontWeight: isActive ? 600 : 400, fontSize: '0.8rem',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px' }}>
        {(['all', 'project', 'personal'] as const).map((cat) => {
          const isActive = categoryFilter === cat;
          const catLabels = { all: 'ทุกประเภท', project: 'งานโครงการ', personal: 'งานส่วนตัว' };
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChangeCategoryFilter(cat)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '5px', border: 'none',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer',
                fontWeight: isActive ? 600 : 400, fontSize: '0.8rem',
              }}
            >
              {catLabels[cat]}
            </button>
          );
        })}
      </div>
    </div>

    <div style={{ position: 'relative', width: '220px' }}>
      <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
      <input
        type="text"
        placeholder="ค้นหาเรื่อง หรือเนื้อหา..."
        value={search}
        onChange={(e) => onChangeSearch(e.target.value)}
        style={{ width: '100%', padding: '0.4rem 0.7rem 0.4rem 2rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.82rem' }}
      />
    </div>
  </div>
);
