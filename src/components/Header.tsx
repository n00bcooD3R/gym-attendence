'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Database } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [dbMode, setDbMode] = useState<'supabase' | 'local'>('supabase');

  useEffect(() => {
    // Check if Supabase environment variables are configured
    const hasUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');
    const hasKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key');
    setSupabaseConfigured(!!(hasUrl && hasKey));

    // Get current mode from cookie
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
        {/* Database Toggle Indicator */}
        <button
          onClick={toggleDbMode}
          className="btn-icon"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: supabaseConfigured ? 'pointer' : 'not-allowed',
            background: dbMode === 'supabase' && supabaseConfigured
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(245, 158, 11, 0.1)',
            borderColor: dbMode === 'supabase' && supabaseConfigured
              ? 'rgba(16, 185, 129, 0.3)'
              : 'rgba(245, 158, 11, 0.3)',
            color: dbMode === 'supabase' && supabaseConfigured
              ? 'var(--accent-green)'
              : 'var(--accent-amber)',
            transition: 'all 0.2s ease',
          }}
          title={
            supabaseConfigured
              ? `Database: ${dbMode === 'supabase' ? 'Supabase (Live)' : 'Local File (Offline)'}. Click to switch database.`
              : 'Supabase credentials not configured in .env.local. Falling back to Local JSON database.'
          }
        >
          <Database size={13} />
          <span>
            {!supabaseConfigured 
              ? 'DB: Local (No Config)' 
              : dbMode === 'supabase' 
                ? 'DB: Supabase (Live)' 
                : 'DB: Local (Offline)'}
          </span>
          <span 
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: !supabaseConfigured 
                ? 'var(--accent-amber)' 
                : dbMode === 'supabase' 
                  ? 'var(--accent-green)' 
                  : 'var(--accent-amber)',
              boxShadow: !supabaseConfigured 
                ? '0 0 6px var(--accent-amber-glow)' 
                : dbMode === 'supabase' 
                  ? '0 0 6px var(--accent-green-glow)' 
                  : '0 0 6px var(--accent-amber-glow)',
            }}
          />
        </button>

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
