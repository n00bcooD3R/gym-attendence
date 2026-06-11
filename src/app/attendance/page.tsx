'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  ClipboardList,
  Search,
  Download,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Fingerprint,
  ScanFace,
  CreditCard,
  CalendarDays,
  Loader,
  RefreshCw,
} from 'lucide-react';
import { AttendanceLog } from '@/lib/types';
import { format } from 'date-fns';

function getMethodIcon(isExpired: boolean) {
  if (isExpired) return <CreditCard size={14} style={{ color: 'var(--accent-red)' }} />;
  return <ScanFace size={14} />;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Set default filter date to today
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dirFilter, setDirFilter] = useState('all');
  const [tab, setTab] = useState<'logs' | 'daily'>('logs');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParam = dateFilter ? `?date=${dateFilter}` : '';
      const res = await fetch(`/api/attendance${queryParam}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  const filteredLogs = logs.filter(log => {
    const name = log.member_name || 'Unknown';
    const code = log.admission_no || 'N/A';
    
    const matchesSearch = 
      name.toLowerCase().includes(search.toLowerCase()) || 
      code.includes(search);

    let matchesDir = true;
    if (dirFilter === 'in') {
      matchesDir = !log.is_expired_access;
    } else if (dirFilter === 'blocked') {
      matchesDir = log.is_expired_access;
    }
    
    return matchesSearch && matchesDir;
  });

  // Build daily summary from logs
  const dailySummary = (() => {
    const memberMap: Record<string, { name: string; code: string; firstIn: string; lastOut: string; punches: number; hasExpiredAttempt: boolean }> = {};
    filteredLogs.forEach(log => {
      const code = log.admission_no || 'N/A';
      if (!memberMap[code]) {
        memberMap[code] = { 
          name: log.member_name || 'Unknown', 
          code, 
          firstIn: '', 
          lastOut: '', 
          punches: 0,
          hasExpiredAttempt: false
        };
      }
      memberMap[code].punches++;
      
      const timeStr = new Date(log.punch_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      if (log.is_expired_access) {
        memberMap[code].hasExpiredAttempt = true;
      } else {
        if (!memberMap[code].firstIn || timeStr < memberMap[code].firstIn) {
          memberMap[code].firstIn = timeStr;
        }
        if (!memberMap[code].lastOut || timeStr > memberMap[code].lastOut) {
          memberMap[code].lastOut = timeStr;
        }
      }
    });
    return Object.values(memberMap);
  })();

  return (
    <>
      <Header title="Attendance" subtitle="View and manage attendance logs" />
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">
            <ClipboardList size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Attendance Logs
          </h2>
          <button className="btn btn-secondary" onClick={fetchLogs} title="Refresh log list">
            <RefreshCw size={16} style={{ marginRight: 6 }} /> Reload
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button className={`tab-link ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
            Raw Punch Logs
          </button>
          <button className={`tab-link ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>
            Daily Summary
          </button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="header-search" style={{ flex: 1, maxWidth: 280 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {tab === 'logs' && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 150 }}
              value={dirFilter}
              onChange={(e) => setDirFilter(e.target.value)}
            >
              <option value="all">All Logs</option>
              <option value="in">Successful Check-in</option>
              <option value="blocked">Blocked Expiry</option>
            </select>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 50, gap: 10 }}>
            <Loader className="animate-spin" size={24} />
            <span>Loading biometric records...</span>
          </div>
        ) : tab === 'logs' ? (
          <div className="glass-card section-card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Code (ID)</th>
                    <th>Date</th>
                    <th>Punch Time</th>
                    <th>Access Status</th>
                    <th>Method</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const pDate = new Date(log.punch_time);
                    const formattedTime = pDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const formattedDate = pDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="activity-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                              {getInitials(log.member_name || 'Unknown')}
                            </div>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.member_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{log.admission_no || 'N/A'}</td>
                        <td>{formattedDate}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formattedTime}</td>
                        <td>
                          {log.is_expired_access ? (
                            <span className="badge expired">
                              <ArrowUpRight size={12} /> Blocked Expiry
                            </span>
                          ) : (
                            <span className="badge present">
                              <ArrowDownRight size={12} /> Check In
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: log.is_expired_access ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
                            {getMethodIcon(log.is_expired_access)}
                            <span style={{ fontSize: 13 }}>{log.is_expired_access ? 'Blocked' : 'Face'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{log.device_name || 'eSSL X2008'}</td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <ClipboardList size={40} className="empty-state-icon" />
                          <p className="empty-state-text">No attendance logs found for this filter</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card section-card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Code (ID)</th>
                    <th>First Punch</th>
                    <th>Last Punch</th>
                    <th>Total Logs</th>
                    <th>Access State</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="activity-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                            {getInitials(row.name)}
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{row.code}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{row.firstIn || '—'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{row.lastOut || '—'}</td>
                      <td>{row.punches}</td>
                      <td>
                        {row.hasExpiredAttempt ? (
                          <span className="badge expired">
                            <span className="badge-dot" /> Expired Attempt
                          </span>
                        ) : (
                          <span className="badge present">
                            <span className="badge-dot" /> Verified OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dailySummary.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <ClipboardList size={40} className="empty-state-icon" />
                          <p className="empty-state-text">No daily summaries available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
