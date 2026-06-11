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
} from 'lucide-react';

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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Dumbbell size={22} />
        </div>
        <div>
          <div className="sidebar-logo-text">GymTrack</div>
          <div className="sidebar-logo-sub">Attendance System</div>
        </div>
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
  );
}
