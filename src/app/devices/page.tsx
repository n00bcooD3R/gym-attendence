'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Cpu,
  RefreshCw,
  Clock,
  Send,
  Wifi,
  WifiOff,
  Fingerprint,
  Settings,
  Terminal,
  CheckCircle,
  XCircle,
  Loader,
  X,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Device, DeviceCommand } from '@/lib/types';

const quickCommands = [
  { cmd: 'CHECK', label: 'Check Status', icon: <Wifi size={16} /> },
  { cmd: 'INFO', label: 'Device Info', icon: <Settings size={16} /> },
  { cmd: 'REBOOT', label: 'Restart Device', icon: <RefreshCw size={16} /> },
  { cmd: 'CLEAR LOG', label: 'Clear Logs', icon: <Terminal size={16} /> },
];

function getStatusIcon(status: string) {
  if (status === 'executed') return <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />;
  if (status === 'failed') return <XCircle size={14} style={{ color: 'var(--accent-red)' }} />;
  if (status === 'sent') return <Loader size={14} style={{ color: 'var(--accent-amber)', animation: 'spin 1s linear infinite' }} />;
  return <Clock size={14} style={{ color: 'var(--accent-purple)' }} />;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCmdModal, setShowCmdModal] = useState(false);
  const [customCmd, setCustomCmd] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ queued: number; total: number } | null>(null);

  const [modalCmdType, setModalCmdType] = useState('CHECK');
  const [modalNotes, setModalNotes] = useState('');

  const fetchDevicesAndCommands = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (data.devices) setDevices(data.devices);
      if (data.commands) setCommands(data.commands);
    } catch (err) {
      console.error('Error fetching device settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevicesAndCommands();
    // Poll updates every 5 seconds for live status
    const interval = setInterval(fetchDevicesAndCommands, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = async (cmd: string, title: string) => {
    const defaultDev = devices[0];
    if (!defaultDev) {
      alert('No devices registered in system!');
      return;
    }

    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: defaultDev.id,
          command: cmd,
          commandType: 'device_action',
          title: title,
        }),
      });

      if (res.ok) {
        setCustomCmd('');
        fetchDevicesAndCommands();
      } else {
        alert('Failed to queue command');
      }
    } catch (err) {
      console.error('Error queueing command:', err);
    }
  };

  const handleBulkSync = async () => {
    if (!confirm(`This will queue DATA UPDATE USERINFO commands for ALL members in the database and push them to the device. Continue?`)) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/devices/sync-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ queued: data.queued, total: data.total });
        fetchDevicesAndCommands();
      } else {
        alert('Bulk sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Bulk sync error:', err);
      alert('Network error during bulk sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let label = 'Check Device';
    if (modalCmdType === 'REBOOT') label = 'Restart Device';
    else if (modalCmdType === 'INFO') label = 'Device Info';
    else if (modalCmdType === 'CLEAR LOG') label = 'Clear Attendance Log';
    else if (modalCmdType === 'CLEAR DATA') label = 'Clear Device Database';
    else if (modalCmdType === 'SET TIME') label = 'Sync Date/Time';
    else if (modalCmdType === 'CUSTOM') label = 'Custom Command';

    const cmd = modalCmdType === 'CUSTOM' ? customCmd : modalCmdType;

    if (!cmd.trim()) {
      alert('Command string cannot be empty');
      return;
    }

    await handleSendCommand(cmd, label + (modalNotes ? ` (${modalNotes})` : ''));
    setShowCmdModal(false);
    setModalNotes('');
    setCustomCmd('');
  };

  const activeDevice = devices[0];

  return (
    <>
      <Header title="Devices" subtitle="Manage biometric devices" />
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">
            <Cpu size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Device Management
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={handleBulkSync}
              disabled={isSyncing || !activeDevice}
              title="Queue DATA UPDATE USERINFO for all members and push to device"
            >
              {isSyncing ? (
                <><Loader size={16} className="animate-spin" /> Syncing...</>
              ) : (
                <><Users size={16} /> Sync All Members to Device</>
              )}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCmdModal(true)}>
              <Send size={16} /> Send Command
            </button>
          </div>
        </div>

        {/* Sync result banner */}
        {syncResult && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius)',
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--accent-green)',
          }}>
            <CheckCircle size={18} />
            <div>
              <strong>Bulk sync queued!</strong> {syncResult.queued} of {syncResult.total} member commands queued.
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
                Device will receive them on next heartbeat poll (within ~30 seconds).
              </span>
            </div>
            <button
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setSyncResult(null)}
            ><X size={16} /></button>
          </div>
        )}

        {/* Important notice about biometrics */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius)',
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 13,
        }}>
          <AlertCircle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-amber)' }}>Why are users missing on device?</strong>
            {' '}The <em>"Sync All Members"</em> button pushes user records (name, PIN, expiry) to the device.
            However, <strong>biometric templates (fingerprint/face)</strong> cannot be sent remotely — members
            must re-enroll their fingerprint/face physically on the device after being re-added.
          </div>
        </div>

        {/* Device Details Card */}
        {loading && devices.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 50, gap: 10 }}>
            <Loader className="animate-spin" size={24} />
            <span>Loading device details...</span>
          </div>
        ) : activeDevice ? (
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Cpu size={36} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800 }}>{activeDevice.device_name || 'eSSL X2008'}</h3>
                  <span className={`badge ${activeDevice.is_online ? 'online' : 'offline'}`}>
                    <span className="badge-dot" />
                    {activeDevice.is_online ? 'Online (Connected)' : 'Offline'}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginTop: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Serial Number</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>{activeDevice.serial_number}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>MAC Address</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14 }}>{activeDevice.mac_address || '00:17:61:10:32:f6'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Firmware</div>
                    <div style={{ fontSize: 14 }}>{activeDevice.firmware_version || 'ZAM70-NF24HA-Ver3.3.12'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Protocols</div>
                    <div style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>ADMS Push Protocol (ZK)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      <Fingerprint size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Algorithms
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--accent-green)' }}>Finger VX10.0 / Face VX4.0</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Last Heartbeat Ping</div>
                    <div style={{ fontSize: 14 }}>
                      {activeDevice.last_ping ? new Date(activeDevice.last_ping).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 30, textAlign: 'center', marginBottom: 24 }}>
            <WifiOff size={48} style={{ color: 'var(--accent-red)', margin: '0 auto 12px' }} />
            <h3>No Biometric Devices Registered</h3>
            <p style={{ color: 'var(--text-muted)' }}>Configure your eSSL device to send ADMS push handshake logs to this server to register it.</p>
          </div>
        )}

        <div className="two-col-grid">
          {/* Quick Commands */}
          <div className="glass-card section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Terminal size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Quick Commands
              </h3>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {quickCommands.map((qc) => (
                  <button
                    key={qc.cmd}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => handleSendCommand(qc.cmd, qc.label)}
                    disabled={!activeDevice}
                  >
                    {qc.icon}
                    {qc.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Custom Command Code</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      placeholder="e.g. DATA UPDATE USERINFO..."
                      value={customCmd}
                      onChange={(e) => setCustomCmd(e.target.value)}
                      disabled={!activeDevice}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (customCmd.trim()) {
                          handleSendCommand(customCmd.trim(), 'Custom Command');
                        }
                      }}
                      disabled={!activeDevice || !customCmd.trim()}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Command History */}
          <div className="glass-card section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Command Queue & Logs
              </h3>
            </div>
            <div className="data-table-container" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Command Description</th>
                    <th>Status</th>
                    <th>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((cmd) => (
                    <tr key={cmd.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cmd.title}</div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cmd.command}>
                          {cmd.command}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {getStatusIcon(cmd.status)}
                          <span className={`badge ${cmd.status === 'executed' ? 'present' : cmd.status === 'failed' ? 'absent' : 'pending'}`}>
                            {cmd.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(cmd.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {commands.length === 0 && (
                    <tr>
                      <td colSpan={3}>
                        <div className="empty-state">
                          <Terminal size={32} className="empty-state-icon" />
                          <p className="empty-state-text">No command history</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Send Command Modal */}
        {showCmdModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCmdModal(false); }}>
            <form className="modal" onSubmit={handleModalSubmit}>
              <div className="modal-header">
                <h2>
                  <Send size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  Send Command to Device
                </h2>
                <button type="button" className="btn-icon" onClick={() => setShowCmdModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Target Device</label>
                  <select className="form-select" disabled>
                    <option>{activeDevice ? `${activeDevice.device_name} — ${activeDevice.serial_number}` : 'No Devices Available'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Command Type</label>
                  <select 
                    className="form-select"
                    value={modalCmdType}
                    onChange={(e) => setModalCmdType(e.target.value)}
                  >
                    <option value="CHECK">Check Connection (CHECK)</option>
                    <option value="INFO">Get Device Info (INFO)</option>
                    <option value="REBOOT">Restart Device (REBOOT)</option>
                    <option value="CLEAR LOG">Clear Attendance Log (CLEAR LOG)</option>
                    <option value="CLEAR DATA">Clear All Data (CLEAR DATA)</option>
                    <option value="SET TIME">Sync Time (SET TIME)</option>
                    <option value="CUSTOM">Custom Command (Enter below)</option>
                  </select>
                </div>
                {modalCmdType === 'CUSTOM' && (
                  <div className="form-group">
                    <label className="form-label">Custom Command String</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. LOG ATTLOG..." 
                      value={customCmd}
                      onChange={(e) => setCustomCmd(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input 
                    className="form-input" 
                    placeholder="Optional notes about this command" 
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCmdModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!activeDevice}>
                  <Send size={16} /> Send Command
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
