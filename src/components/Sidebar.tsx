'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Cpu,
  FileBarChart,
  Upload,
  Fingerprint,
  Dumbbell,
  X,
} from 'lucide-react';
import { useNav } from './NavContext';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Attendance', href: '/attendance', icon: ClipboardList },
  { label: 'Devices', href: '/devices', icon: Cpu },
  { label: 'Reports', href: '/reports', icon: FileBarChart },
  { label: 'Import Data', href: '/import', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useNav();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Dumbbell size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-logo-text">GymTrack</div>
            <div className="sidebar-logo-sub">Attendance System</div>
          </div>
          {/* Close button — only visible on mobile */}
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-device-status">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Fingerprint size={16} style={{ marginRight: 8, color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              eSSL X2008
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            SN: NYU7260400977
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Finger VX10.0 • Face VX4.0
          </div>
        </div>
      </aside>
    </>
  );
}
