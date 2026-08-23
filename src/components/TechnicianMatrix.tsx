import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Search, 
  Star, 
  MapPin, 
  Edit, 
  Trash2, 
  Download, 
  X, 
  Wrench
} from 'lucide-react';

export interface SkillItem {
  name: string;
  level: 1 | 2 | 3;
  certified: boolean;
}

export interface Technician {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  branch: string;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Cooldown';
  rating: number;
  completedJobs: number;
  penaltyPoints: number;
  primaryZone: string;
  skills: SkillItem[];
  status: 'Available' | 'In Cooldown' | 'Busy';
  avatar: string;
}

const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech_1',
    code: 'T-GOLD-01',
    name: 'ทีมช่างสมชาย & ทีม',
    subtitle: 'ช่างใหญ่ Built-in',
    branch: 'สาขารามอินทรา 9',
    tier: 'Gold',
    rating: 4.95,
    completedJobs: 142,
    penaltyPoints: 0,
    primaryZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
    skills: [
      { name: 'Built-in Furniture', level: 3, certified: true },
      { name: 'Electrical & Smart Home', level: 2, certified: true },
      { name: 'Flooring & Tile', level: 2, certified: true }
    ],
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech_2',
    code: 'T-GOLD-02',
    name: 'ทีมช่างวิจัย อินสตอลเลอร์',
    subtitle: 'ช่างแอร์ & ไฟฟ้า',
    branch: 'สาขาราชพฤกษ์',
    tier: 'Gold',
    rating: 4.88,
    completedJobs: 118,
    penaltyPoints: 5,
    primaryZone: 'Zone 2: นนทบุรี (ราชพฤกษ์ - แจ้งวัฒนะ - บางบัวทอง)',
    skills: [
      { name: 'Air Condition & HVAC', level: 3, certified: true },
      { name: 'Electrical & Smart Home', level: 3, certified: true },
      { name: 'Plumbing & Sanitary', level: 2, certified: true }
    ],
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech_3',
    code: 'T-SILV-03',
    name: 'ทีมช่างประเสริฐการช่าง',
    subtitle: 'ช่างปูพื้น SPC & งานไม้',
    branch: 'สาขานวนคร-รามอินทรา',
    tier: 'Silver',
    rating: 4.65,
    completedJobs: 84,
    penaltyPoints: 15,
    primaryZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
    skills: [
      { name: 'Flooring & Tile', level: 3, certified: true },
      { name: 'Built-in Furniture', level: 2, certified: false }
    ],
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech_4',
    code: 'T-SILV-04',
    name: 'ทีมช่างอนันต์ & เดอะแก๊ง',
    subtitle: 'งานผ้าม่าน & วอลเปเปอร์',
    branch: 'สาขารามอินทรา 9',
    tier: 'Silver',
    rating: 4.70,
    completedJobs: 65,
    penaltyPoints: 10,
    primaryZone: 'Zone 3: ปทุมธานี (รังสิต - ลำลูกกา - คลองหลวง)',
    skills: [
      { name: 'Curtains & Wallpaper', level: 2, certified: true },
      { name: 'Electrical & Smart Home', level: 1, certified: true }
    ],
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech_5',
    code: 'T-PEN-05',
    name: 'ทีมช่างกิตติพงศ์',
    subtitle: 'ติด Cooldown จากงานล่าช้า',
    branch: 'สาขาบางนา',
    tier: 'Cooldown',
    rating: 4.20,
    completedJobs: 45,
    penaltyPoints: 45,
    primaryZone: 'Zone 4: สมุทรปราการ (เทพารักษ์ - ศรีนครินทร์ - สำโรง)',
    skills: [
      { name: 'Built-in Furniture', level: 2, certified: true },
      { name: 'Flooring & Tile', level: 1, certified: false }
    ],
    status: 'In Cooldown',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech_6',
    code: 'T-638',
    name: 'ช่างสมหมาย การไฟฟ้า',
    subtitle: 'ไม่ระบุสาขา',
    branch: 'ไม่ระบุสาขา',
    tier: 'Silver',
    rating: 4.50,
    completedJobs: 0,
    penaltyPoints: 0,
    primaryZone: 'Zone 2: นนทบุรี - ปทุมธานี (ราชพฤกษ์ - แจ้งวัฒนะ)',
    skills: [
      { name: 'Electrical & Smart Home', level: 2, certified: true },
      { name: 'Plumbing & Sanitary', level: 2, certified: true }
    ],
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech_7',
    code: 'T-125',
    name: 'สมบัติ ทองแท้',
    subtitle: 'ไม่ระบุสาขา',
    branch: 'ไม่ระบุสาขา',
    tier: 'Silver',
    rating: 4.80,
    completedJobs: 12,
    penaltyPoints: 0,
    primaryZone: 'Zone 1: กรุงเทพฯ',
    skills: [
      { name: 'Built-in Furniture', level: 1, certified: true }
    ],
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

export const TechnicianMatrix: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('nt_technicians_data');
    return saved ? JSON.parse(saved) : INITIAL_TECHNICIANS;
  });

  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    const saved = localStorage.getItem('nt_tech_view_mode');
    return (saved as 'card' | 'list') || 'card';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formTier, setFormTier] = useState<'Gold' | 'Silver' | 'Bronze' | 'Cooldown'>('Gold');
  const [formRating, setFormRating] = useState('4.80');
  const [formCompletedJobs, setFormCompletedJobs] = useState('50');
  const [formPenaltyPoints, setFormPenaltyPoints] = useState('0');
  const [formPrimaryZone, setFormPrimaryZone] = useState('');
  const [formStatus, setFormStatus] = useState<'Available' | 'In Cooldown' | 'Busy'>('Available');
  const [formSkillsText, setFormSkillsText] = useState('Built-in Furniture:3:cert, Electrical & Smart Home:2:cert');

  useEffect(() => {
    localStorage.setItem('nt_technicians_data', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem('nt_tech_view_mode', viewMode);
  }, [viewMode]);

  const handleOpenAdd = () => {
    setEditingTech(null);
    setFormCode(`T-GOLD-0${technicians.length + 1}`);
    setFormName('');
    setFormSubtitle('ช่างติดตั้งมืออาชีพ');
    setFormBranch('สาขารามอินทรา 9');
    setFormTier('Gold');
    setFormRating('4.85');
    setFormCompletedJobs('30');
    setFormPenaltyPoints('0');
    setFormPrimaryZone('Zone 1: กรุงเทพฯ');
    setFormStatus('Available');
    setFormSkillsText('Built-in Furniture:3:cert, Electrical & Smart Home:2:cert');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tech: Technician) => {
    setEditingTech(tech);
    setFormCode(tech.code);
    setFormName(tech.name);
    setFormSubtitle(tech.subtitle);
    setFormBranch(tech.branch);
    setFormTier(tech.tier);
    setFormRating(String(tech.rating));
    setFormCompletedJobs(String(tech.completedJobs));
    setFormPenaltyPoints(String(tech.penaltyPoints));
    setFormPrimaryZone(tech.primaryZone);
    setFormStatus(tech.status);
    
    const skillStr = tech.skills.map(s => `${s.name}:${s.level}:${s.certified ? 'cert' : 'uncert'}`).join(', ');
    setFormSkillsText(skillStr);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลทีมช่างนี้ใช่หรือไม่?')) {
      setTechnicians(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('กรุณากรอกชื่อทีมช่าง');
      return;
    }

    const parsedSkills: SkillItem[] = formSkillsText.split(',').map(item => {
      const parts = item.trim().split(':');
      const name = parts[0] || 'General Skill';
      const level = Math.min(3, Math.max(1, parseInt(parts[1] || '1', 10))) as 1 | 2 | 3;
      const certified = (parts[2] || '').toLowerCase() === 'cert';
      return { name, level, certified };
    });

    if (editingTech) {
      setTechnicians(prev => prev.map(t => t.id === editingTech.id ? {
        ...t,
        code: formCode,
        name: formName,
        subtitle: formSubtitle,
        branch: formBranch,
        tier: formTier,
        rating: parseFloat(formRating) || 4.5,
        completedJobs: parseInt(formCompletedJobs, 10) || 0,
        penaltyPoints: parseInt(formPenaltyPoints, 10) || 0,
        primaryZone: formPrimaryZone,
        status: formStatus,
        skills: parsedSkills
      } : t));
    } else {
      const newTech: Technician = {
        id: 'tech_' + Date.now(),
        code: formCode,
        name: formName,
        subtitle: formSubtitle,
        branch: formBranch,
        tier: formTier,
        rating: parseFloat(formRating) || 4.5,
        completedJobs: parseInt(formCompletedJobs, 10) || 0,
        penaltyPoints: parseInt(formPenaltyPoints, 10) || 0,
        primaryZone: formPrimaryZone,
        status: formStatus,
        skills: parsedSkills,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };
      setTechnicians(prev => [newTech, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleQuickLoadSample = () => {
    setTechnicians(INITIAL_TECHNICIANS);
  };

  // Filtered Technicians
  const filteredTechnicians = technicians.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || 
      t.name.toLowerCase().includes(q) || 
      t.code.toLowerCase().includes(q) || 
      t.primaryZone.toLowerCase().includes(q) || 
      t.branch.toLowerCase().includes(q);

    const matchesSkill = skillFilter === 'All' || t.skills.some(s => s.name === skillFilter);
    const matchesTier = tierFilter === 'All' || t.tier === tierFilter;

    return matchesQuery && matchesSkill && matchesTier;
  });

  const allSkillsList = Array.from(new Set(technicians.flatMap(t => t.skills.map(s => s.name))));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Bar */}
      <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <Wrench size={22} color="white" />
            </div>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '1.65rem', margin: 0, fontWeight: 700 }}>
                จัดการรายชื่อทีมช่าง & ทักษะ (Technicians Matrix)
              </h1>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            บริหารจัดการระดับความชำนาญ (Skill Level 1-3), การรับรองมาตรฐาน (Certified), สังกัดสาขา และคะแนน Penalty ของทีมช่าง
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleOpenAdd}
            className="hover-lift"
            style={{ 
              background: 'var(--accent-primary)', 
              color: 'white', 
              border: 'none', 
              padding: '0.65rem 1.25rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Plus size={16} /> นำเข้า / เพิ่มทีมช่างใหม่
          </button>
          
          <button 
            onClick={handleQuickLoadSample}
            className="hover-lift"
            style={{ 
              background: 'var(--bg-tertiary)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-color)', 
              padding: '0.65rem 1.25rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 500, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <Download size={16} /> โหลดช่างตัวอย่างด่วน
          </button>
        </div>
      </div>

      {/* Filter and View Switcher Control Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search & Filters Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="ค้นหาชื่อช่าง, รหัสช่าง, โซน..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--bg-primary)', 
                  color: 'var(--text-primary)', 
                  fontSize: '0.875rem' 
                }}
              />
            </div>

            <select 
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              style={{ 
                padding: '0.6rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)', 
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <option value="All">ทุกหมวดหมู่ Skill</option>
              {allSkillsList.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <select 
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              style={{ 
                padding: '0.6rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)', 
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <option value="All">ทุกระดับ Tier</option>
              <option value="Gold">Gold Tier</option>
              <option value="Silver">Silver Tier</option>
              <option value="Bronze">Bronze Tier</option>
              <option value="Cooldown">Cooldown</option>
            </select>
          </div>

          {/* Right Action: JSON Template & View Toggle (Card vs List) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <Download size={14} /> ดาวน์โหลดเทมเพลต JSON
            </span>

            {/* View Mode Toggle Switcher */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--bg-primary)', 
              padding: '0.25rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)' 
            }}>
              <button 
                onClick={() => setViewMode('card')}
                title="มุมมองแบบ Card (Card View)"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.45rem 0.85rem', 
                  borderRadius: 'calc(var(--radius-md) - 2px)', 
                  border: 'none', 
                  background: viewMode === 'card' ? 'var(--accent-primary)' : 'transparent', 
                  color: viewMode === 'card' ? '#ffffff' : 'var(--text-secondary)', 
                  fontWeight: viewMode === 'card' ? 600 : 400,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutGrid size={16} />
                <span>Card</span>
              </button>

              <button 
                onClick={() => setViewMode('list')}
                title="มุมมองแบบ List (List View)"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.45rem 0.85rem', 
                  borderRadius: 'calc(var(--radius-md) - 2px)', 
                  border: 'none', 
                  background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent', 
                  color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)', 
                  fontWeight: viewMode === 'list' ? 600 : 400,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <List size={16} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Rendering based on ViewMode */}
      {filteredTechnicians.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          ไม่พบข้อมูลทีมช่างที่ตรงกับเงื่อนไขการค้นหา
        </div>
      ) : viewMode === 'card' ? (
        
        /* ════════════ CARD VIEW ════════════ */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredTechnicians.map(tech => {
            const isCooldown = tech.tier === 'Cooldown' || tech.status === 'In Cooldown';
            return (
              <div 
                key={tech.id} 
                className="glass-panel hover-lift"
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  border: isCooldown ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                  background: isCooldown ? 'rgba(239, 68, 68, 0.02)' : undefined,
                  position: 'relative'
                }}
              >
                {/* Header Row: Avatar, Info & Tier Tag */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <img 
                    src={tech.avatar} 
                    alt={tech.name} 
                    style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tech.name}
                      </h3>
                      
                      {/* Tier Badge */}
                      <span style={{ 
                        fontSize: '0.725rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 'var(--radius-sm)',
                        background: tech.tier === 'Gold' ? 'rgba(245, 158, 11, 0.15)' : 
                                    tech.tier === 'Silver' ? 'rgba(148, 163, 184, 0.15)' : 
                                    tech.tier === 'Cooldown' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: tech.tier === 'Gold' ? '#f59e0b' : 
                               tech.tier === 'Silver' ? '#94a3b8' : 
                               tech.tier === 'Cooldown' ? '#ef4444' : '#10b981',
                        border: tech.tier === 'Gold' ? '1px solid rgba(245, 158, 11, 0.3)' : 
                                tech.tier === 'Silver' ? '1px solid rgba(148, 163, 184, 0.3)' : 
                                tech.tier === 'Cooldown' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {tech.tier}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>{tech.code}</span> • <span>{tech.branch}</span>
                    </div>
                  </div>
                </div>

                {/* Subtitle / Spec */}
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>({tech.subtitle})</span>
                </div>

                {/* Metrics Box (Rating, Jobs, Penalty) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  padding: '0.75rem', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  gap: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>คะแนนเฉลี่ย</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" /> {tech.rating.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>งานสำเร็จ</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {tech.completedJobs} งาน
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>คะแนนโดนปรับ</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: tech.penaltyPoints > 0 ? '#ef4444' : '#10b981', marginTop: '0.1rem' }}>
                      {tech.penaltyPoints} คะแนน
                    </div>
                  </div>
                </div>

                {/* Zone Info */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <MapPin size={15} color="var(--accent-primary)" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>พื้นที่หลัก:</strong> {tech.primaryZone}
                  </div>
                </div>

                {/* Skills Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ระดับทักษะความสามารถ ({tech.skills.length} ทักษะ):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {tech.skills.map((skill, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          fontSize: '0.785rem', 
                          padding: '0.35rem 0.6rem', 
                          background: 'rgba(255,255,255,0.03)', 
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{skill.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {skill.certified && (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                              Cert
                            </span>
                          )}
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }}>
                            Level {skill.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Status & Actions */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.785rem' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: tech.status === 'Available' ? '#10b981' : '#ef4444' 
                    }} />
                    <span style={{ color: tech.status === 'Available' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      สถานะ: {tech.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleDelete(tech.id)} 
                      title="ลบทีมช่าง" 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} 
                      className="hover-lift"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(tech)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--text-primary)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem',
                        fontSize: '0.785rem',
                        fontWeight: 500
                      }} 
                      className="hover-lift"
                    >
                      <Edit size={14} /> แก้ไขข้อมูลช่าง
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* ════════════ LIST VIEW ════════════ */
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.875rem 1rem' }}>ช่าง / ทีมช่าง</th>
                <th style={{ padding: '0.875rem 1rem' }}>สังกัดสาขา & โซนพื้นที่</th>
                <th style={{ padding: '0.875rem 1rem' }}>Tier / สถานะ</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>เรตติ้ง / งานสำเร็จ</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>คะแนน Penalty</th>
                <th style={{ padding: '0.875rem 1rem' }}>ทักษะความสามารถ</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTechnicians.map((tech, index) => {
                const isCooldown = tech.tier === 'Cooldown' || tech.status === 'In Cooldown';
                return (
                  <tr 
                    key={tech.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      background: isCooldown ? 'rgba(239, 68, 68, 0.03)' : (index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                      transition: 'background 0.2s' 
                    }}
                    className="table-row-hover"
                  >
                    {/* Tech Name & Info */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={tech.avatar} alt={tech.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{tech.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{tech.code}</span> • {tech.subtitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Branch & Zone */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tech.branch}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <MapPin size={12} color="var(--accent-primary)" /> {tech.primaryZone}
                      </div>
                    </td>

                    {/* Tier & Status */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '4px',
                          background: tech.tier === 'Gold' ? 'rgba(245, 158, 11, 0.15)' : 
                                      tech.tier === 'Silver' ? 'rgba(148, 163, 184, 0.15)' : 
                                      tech.tier === 'Cooldown' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: tech.tier === 'Gold' ? '#f59e0b' : 
                                 tech.tier === 'Silver' ? '#94a3b8' : 
                                 tech.tier === 'Cooldown' ? '#ef4444' : '#10b981'
                        }}>
                          {tech.tier} Tier
                        </span>
                        
                        <div style={{ fontSize: '0.725rem', color: tech.status === 'Available' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tech.status === 'Available' ? '#10b981' : '#ef4444' }} />
                          {tech.status}
                        </div>
                      </div>
                    </td>

                    {/* Rating & Jobs */}
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" /> {tech.rating.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {tech.completedJobs} งานสำเร็จ
                      </div>
                    </td>

                    {/* Penalty */}
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: tech.penaltyPoints > 0 ? '#ef4444' : '#10b981',
                        fontSize: '0.9rem' 
                      }}>
                        {tech.penaltyPoints}
                      </span>
                    </td>

                    {/* Skills Badges */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxWidth: '300px' }}>
                        {tech.skills.map((s, idx) => (
                          <span key={idx} style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.2rem 0.45rem', 
                            borderRadius: '4px', 
                            background: 'var(--bg-tertiary)', 
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            {s.name}
                            <span style={{ color: '#3b82f6', fontWeight: 700 }}>L{s.level}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleOpenEdit(tech)} 
                          title="แก้ไขข้อมูลช่าง"
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.785rem' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(tech.id)} 
                          title="ลบช่าง"
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add / Edit Technician */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', borderRadius: '16px' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }} className="text-gradient">
                {editingTech ? 'แก้ไขข้อมูลทีมช่าง' : 'เพิ่มทีมช่างใหม่ (Technician Matrix)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>รหัสช่าง</label>
                  <input 
                    type="text" 
                    value={formCode} 
                    onChange={e => setFormCode(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ชื่อทีมช่าง / ชื่อช่าง</label>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>รายละเอียด / ฉายา</label>
                  <input 
                    type="text" 
                    value={formSubtitle} 
                    onChange={e => setFormSubtitle(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>สังกัดสาขา</label>
                  <input 
                    type="text" 
                    value={formBranch} 
                    onChange={e => setFormBranch(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ระดับ Tier</label>
                  <select 
                    value={formTier} 
                    onChange={e => setFormTier(e.target.value as any)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Cooldown">Cooldown</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>คะแนน Rating (0-5)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="5" 
                    value={formRating} 
                    onChange={e => setFormRating(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>คะแนน Penalty</label>
                  <input 
                    type="number" 
                    value={formPenaltyPoints} 
                    onChange={e => setFormPenaltyPoints(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>พื้นที่หลัก / Zone</label>
                <input 
                  type="text" 
                  value={formPrimaryZone} 
                  onChange={e => setFormPrimaryZone(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  รายการทักษะ (รูปแบบ: ชื่อ:Level:cert เช่น "Built-in Furniture:3:cert, Flooring & Tile:2:uncert")
                </label>
                <input 
                  type="text" 
                  value={formSkillsText} 
                  onChange={e => setFormSkillsText(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.25rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
