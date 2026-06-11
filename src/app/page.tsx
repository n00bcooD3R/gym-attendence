'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Cpu,
  WifiOff,
  Fingerprint,
  ScanFace,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Loader,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, marginBottom: 2 }}>
            {entry.dataKey}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const d = await res.json();
      if (d) {
        setData(d);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll updates every 10 seconds for real-time dashboard activity
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', gap: 15, background: '#0a0e1a', color: '#fff' }}>
        <Loader className="animate-spin" size={32} style={{ color: 'var(--accent-cyan)' }} />
        <span>Loading GymTrack live dashboard...</span>
      </div>
    );
  }

  const { stats, recentActivity, chartData, devices } = data || {
    stats: { totalMembers: 0, presentToday: 0, absentToday: 0, lateToday: 0, devicesOnline: 0, devicesOffline: 0 },
    recentActivity: [],
    chartData: [],
    devices: []
  };

  return (
    <>
      <Header title="Dashboard" subtitle="Overview of your gym attendance" />
      <div className="page-container">
        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            icon={<Users size={22} />}
            value={stats.totalMembers}
            label="Total Active Members"
            color="blue"
          />
          <StatCard
            icon={<UserCheck size={22} />}
            value={stats.presentToday}
            label="Present Today"
            color="green"
          />
          <StatCard
            icon={<UserX size={22} />}
            value={stats.absentToday}
            label="Absent Today"
            color="red"
          />
          <StatCard
            icon={<Clock size={22} />}
            value={stats.lateToday}
            label="Late Arrivals Today"
            color="amber"
          />
          <StatCard
            icon={<Cpu size={22} />}
            value={stats.devicesOnline}
            label="Biometrics Online"
            color="cyan"
          />
          <StatCard
            icon={<WifiOff size={22} />}
            value={stats.devicesOffline}
            label="Biometrics Offline"
            color="purple"
          />
        </div>

        {/* Two Column Section */}
        <div className="two-col-grid">
          {/* Attendance Trend Chart */}
          <div className="glass-card section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Activity size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Weekly Attendance Trend
              </h3>
              <button className="btn-icon" onClick={fetchDashboard} title="Reload statistics">
                <RefreshCw size={14} />
              </button>
            </div>
            <div style={{ padding: '16px 8px 8px 0', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradientPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#10b981"
                    fill="url(#gradientPresent)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    fill="url(#gradientAbsent)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    fill="url(#gradientLate)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Fingerprint size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Recent Activity
              </h3>
              <span className="badge online">
                <span className="badge-dot animate-pulse" /> Live Feed
              </span>
            </div>
            <div className="section-body" style={{ maxHeight: 280, overflowY: 'auto' }}>
              {recentActivity.map((item: any, i: number) => (
                <div 
                  key={item.id} 
                  className={`activity-item animate-slide-in ${item.is_expired_access ? 'expired-attempt-row' : ''}`} 
                  style={{ 
                    animationDelay: `${i * 0.05}s`,
                    borderLeft: item.is_expired_access ? '3px solid var(--accent-red)' : 'none',
                    paddingLeft: item.is_expired_access ? 12 : 15
                  }}
                >
                  <div className="activity-avatar" style={{ background: item.is_expired_access ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', color: item.is_expired_access ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {getInitials(item.name)}
                  </div>
                  <div className="activity-info">
                    <div className="activity-name" style={{ color: item.is_expired_access ? 'var(--accent-red)' : 'var(--text-primary)', fontWeight: item.is_expired_access ? 700 : 600 }}>
                      {item.name}
                    </div>
                    <div className="activity-detail">
                      {item.is_expired_access ? (
                        <AlertOctagon size={12} style={{ display: 'inline', color: 'var(--accent-red)', marginRight: 4, verticalAlign: 'middle' }} />
                      ) : item.direction === 'in' ? (
                        <ArrowDownRight size={12} style={{ display: 'inline', color: 'var(--accent-green)', marginRight: 4 }} />
                      ) : (
                        <ArrowUpRight size={12} style={{ display: 'inline', color: 'var(--accent-red)', marginRight: 4 }} />
                      )}
                      
                      <span style={{ color: item.is_expired_access ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {item.action}
                      </span>
                      
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                        (Code: {item.code})
                      </span>
                    </div>
                  </div>
                  <div className="activity-time" style={{ color: item.is_expired_access ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    {item.time}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', padding: 40, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Fingerprint size={32} style={{ marginBottom: 8 }} />
                  <span>No recent attendance activity</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="glass-card section-card" style={{ marginTop: 0 }}>
          <div className="section-header">
            <h3 className="section-title">
              <Cpu size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Connected Biometric Hardware
            </h3>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device Name</th>
                  <th>Serial Number</th>
                  <th>Device Status</th>
                  <th>Last Heartbeat</th>
                  <th>Firmware Version</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device: any, i: number) => (
                  <tr key={device.serial}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background: device.status === 'online' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: device.status === 'online' ? 'var(--accent-cyan)' : 'var(--accent-red)',
                        }}>
                          <Cpu size={18} />
                        </div>
                        {device.name || 'eSSL Device'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{device.serial}</td>
                    <td>
                      <span className={`badge ${device.status}`}>
                        <span className="badge-dot" />
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>{device.lastPing}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{device.firmware}</td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No biometric devices detected. Point your hardware server settings to this server to link.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
