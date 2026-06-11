'use client';

import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header-title">{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="header-actions">
        <div className="header-search">
          <Search size={16} />
          <input type="text" placeholder="Search members..." />
        </div>
        <button className="btn-icon" title="Notifications">
          <Bell size={18} />
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}
