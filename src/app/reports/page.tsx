'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  FileBarChart,
  Download,
  CalendarDays,
  UserCheck,
  UserX,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const monthlyData = [
  { day: '1', present: 45, absent: 7 },
  { day: '2', present: 42, absent: 10 },
  { day: '3', present: 48, absent: 4 },
  { day: '4', present: 44, absent: 8 },
  { day: '5', present: 40, absent: 12 },
  { day: '6', present: 35, absent: 17 },
  { day: '7', present: 20, absent: 32 },
  { day: '8', present: 46, absent: 6 },
  { day: '9', present: 47, absent: 5 },
  { day: '10', present: 44, absent: 8 },
  { day: '11', present: 43, absent: 9 },
];

const pieData = [
  { name: 'Present', value: 412, color: '#10b981' },
  { name: 'Absent', value: 88, color: '#ef4444' },
  { name: 'Late', value: 45, color: '#f59e0b' },
  { name: 'Half Day', value: 22, color: '#8b5cf6' },
];

const memberReport = [
  { name: 'Rahul Sharma', code: '001', present: 24, absent: 2, late: 1, avgHours: '2h 15m', percentage: '92%' },
  { name: 'Priya Patel', code: '002', present: 26, absent: 0, late: 0, avgHours: '1h 45m', percentage: '100%' },
  { name: 'Amit Kumar', code: '003', present: 22, absent: 4, late: 3, avgHours: '2h 30m', percentage: '85%' },
  { name: 'Sneha Reddy', code: '004', present: 18, absent: 8, late: 2, avgHours: '1h 20m', percentage: '69%' },
  { name: 'Vikram Singh', code: '005', present: 25, absent: 1, late: 1, avgHours: '3h 00m', percentage: '96%' },
  { name: 'Ananya Joshi', code: '006', present: 23, absent: 3, late: 2, avgHours: '1h 55m', percentage: '88%' },
  { name: 'Rajesh Gupta', code: '007', present: 20, absent: 6, late: 4, avgHours: '2h 10m', percentage: '77%' },
  { name: 'Deepa Nair', code: '008', present: 26, absent: 0, late: 0, avgHours: '1h 30m', percentage: '100%' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; fill: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
      }}>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Day {label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.fill, marginBottom: 2 }}>
            {entry.dataKey}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [tab, setTab] = useState<'monthly' | 'member'>('monthly');
  const [month, setMonth] = useState('2026-06');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <>
      <Header title="Reports" subtitle="Attendance analytics and reports" />
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">
            <FileBarChart size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Attendance Reports
          </h2>
          <button className="btn btn-primary">
            <Download size={16} /> Export Report
          </button>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatCard icon={<UserCheck size={22} />} value="412" label="Total Present" color="green" />
          <StatCard icon={<UserX size={22} />} value="88" label="Total Absent" color="red" />
          <StatCard icon={<Clock size={22} />} value="45" label="Late Arrivals" color="amber" />
          <StatCard icon={<TrendingUp size={22} />} value="82%" label="Avg Attendance" color="blue" />
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="month"
              className="form-input"
              style={{ width: 'auto' }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button className={`tab-link ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>
            Monthly Overview
          </button>
          <button className={`tab-link ${tab === 'member' ? 'active' : ''}`} onClick={() => setTab('member')}>
            Member-wise Report
          </button>
        </div>

        {tab === 'monthly' ? (
          <div className="two-col-grid">
            {/* Monthly Bar Chart */}
            <div className="glass-card section-card">
              <div className="section-header">
                <h3 className="section-title">Daily Attendance — June 2026</h3>
              </div>
              <div style={{ padding: '16px 8px 8px 0', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-card section-card">
              <div className="section-header">
                <h3 className="section-title">Attendance Distribution</h3>
              </div>
              <div style={{ padding: 16, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Users size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Member Attendance Summary — June 2026
              </h3>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Code</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Avg Duration</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {memberReport.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="activity-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                            {getInitials(m.name)}
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{m.code}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{m.present}</td>
                      <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{m.absent}</td>
                      <td style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{m.late}</td>
                      <td>{m.avgHours}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 60,
                            height: 6,
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: m.percentage,
                              background: parseInt(m.percentage) >= 90 ? 'var(--accent-green)' :
                                parseInt(m.percentage) >= 75 ? 'var(--accent-amber)' : 'var(--accent-red)',
                              borderRadius: 3,
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{m.percentage}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
