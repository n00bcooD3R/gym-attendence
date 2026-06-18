'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Database, Menu } from 'lucide-react';
import { useNav } from './NavContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [dbMode, setDbMode] = useState<'supabase' | 'local'>('supabase');
  const { openSidebar } = useNav();

  useEffect(() => {
    const hasUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');
    const hasKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key');
    setSupabaseConfigured(!!(hasUrl && hasKey));

    const match = document.cookie.match(/(^|;)\s*db_mode\s*=\s*([^;]+)/);
    if (match && match[2] === 'local') {
      setDbMode('local');
    } else {
      setDbMode('supabase');
    }
  }, []);

  const toggleDbMode = () => {
    if (!supabaseConfigured) return;
    const newMode = dbMode === 'supabase' ? 'local' : 'supabase';
    document.cookie = `db_mode=${newMode}; path=/; max-age=31536000`;
    setDbMode(newMode);
    window.location.reload();
  };

  const isLive = dbMode === 'supabase' && supabaseConfigured;

  return (
    <header className="header">
      <div className="header-left">
        {/* Hamburger menu — visible only on mobile */}
        <button
          className="header-menu-btn"
          onClick={openSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && (
            <p className="header-subtitle">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="header-actions">
        {/* DB badge */}
        <button
          onClick={toggleDbMode}
          className="btn-icon header-db-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: supabaseConfigured ? 'pointer' : 'not-allowed',
            background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            borderColor: isLive ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
            color: isLive ? 'var(--accent-green)' : 'var(--accent-amber)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          title={
            supabaseConfigured
              ? `Database: ${dbMode === 'supabase' ? 'Supabase (Live)' : 'Local File (Offline)'}. Click to switch.`
              : 'Supabase credentials not configured in .env.local.'
          }
        >
          <Database size={13} />
          <span className="db-badge-label">
            {!supabaseConfigured
              ? 'Local (No Config)'
              : dbMode === 'supabase'
                ? 'Supabase'
                : 'Local (Offline)'}
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: !supabaseConfigured
                ? 'var(--accent-amber)'
                : isLive
                  ? 'var(--accent-green)'
                  : 'var(--accent-amber)',
              boxShadow: !supabaseConfigured
                ? '0 0 6px var(--accent-amber-glow)'
                : isLive
                  ? '0 0 6px var(--accent-green-glow)'
                  : '0 0 6px var(--accent-amber-glow)',
              flexShrink: 0,
            }}
          />
        </button>

        {/* Search — hidden on small mobile */}
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
            flexShrink: 0,
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}
