import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarRange, CheckSquare, Clock, LayoutDashboard, Users } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const links = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/project-plan', icon: CalendarRange, label: 'Plan' },
    { path: '/timesheet', icon: Clock, label: 'Time' },
    { path: '/team', icon: Users, label: 'Team' },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {links.map(({ path, icon: Icon, label }) => (
        <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>
          <Icon size={18} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};
