'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Fingerprint,
  ScanFace,
  CreditCard,
  X,
  UserPlus,
  Loader,
  Power,
  RefreshCw,
} from 'lucide-react';
import { Member } from '@/lib/types';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getVerificationIcon(active: boolean, nextDueDate: string) {
  const expired = new Date(nextDueDate) < new Date();
  if (!active || expired) return <CreditCard size={14} style={{ color: 'var(--accent-red)' }} />;
  return <><ScanFace size={14} /> <Fingerprint size={14} /></>;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    // Auto-generate next available code (e.g. 0001, 0002)
    const codes = members.map(m => parseInt(m.admission_no)).filter(n => !isNaN(n));
    const nextCode = codes.length > 0 ? Math.max(...codes) + 1 : 1;
    setFormCode(nextCode.toString().padStart(4, '0'));
    setFormPhone('');
    // Set default expiry date to 1 month from now
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    setFormExpiry(oneMonthFromNow.toISOString().split('T')[0]);
    setFormDepartment('Fitness');
    setFormActive(true);
    setFormNotes('');
    setIsSaving(false);
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormCode(member.admission_no);
    setFormPhone(member.phone);
    setFormExpiry(member.next_due_date ? member.next_due_date.split('T')[0] : '');
    setFormDepartment(member.department || 'Fitness');
    setFormActive(member.active);
    setFormNotes(member.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode || !formExpiry) {
      alert('Name, Admission Code, and Expiry Date are required!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName,
        admission_no: formCode.trim().padStart(4, '0'),
        phone: formPhone,
        next_due_date: formExpiry,
        department: formDepartment,
        active: formActive,
        notes: formNotes,
      };

      if (editingMember) {
        // Update
        const res = await fetch('/api/members', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingMember.id, ...payload }),
        });
        if (res.ok) {
          await fetchMembers();
          setShowModal(false);
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to update member');
        }
      } else {
        // Create
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchMembers();
          setShowModal(false);
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to add member');
        }
      }
    } catch (err) {
      console.error('Error saving member:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete member ${name}? This will also delete them from the biometric device.`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMembers();
      } else {
        alert('Failed to delete member');
      }
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.admission_no.includes(search) ||
      (m.phone && m.phone.includes(search));

    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = m.next_due_date ? m.next_due_date < todayStr : false;

    let memberStatus = 'active';
    if (!m.active) memberStatus = 'inactive';
    else if (isExpired) memberStatus = 'expired';

    const matchesStatus = filterStatus === 'all' || memberStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (m: Member) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = m.next_due_date ? m.next_due_date < todayStr : false;

    if (!m.active) {
      return (
        <span className="badge inactive">
          <span className="badge-dot" /> Inactive
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="badge expired">
          <span className="badge-dot" /> Expired
        </span>
      );
    }
    return (
      <span className="badge active">
        <span className="badge-dot" /> Active
      </span>
    );
  };

  return (
    <>
      <Header title="Members" subtitle="Manage gym members and biometric enrollment" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <h2 className="page-title">
              <Users size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
              Members ({filteredMembers.length})
            </h2>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Member
          </button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="header-search" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, code, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 140 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
          <button className="btn btn-secondary btn-icon" onClick={fetchMembers} title="Reload list">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Members Table */}
        <div className="glass-card section-card">
          <div className="data-table-container">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 50, gap: 10 }}>
                <Loader className="animate-spin" size={24} />
                <span>Loading member profiles...</span>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Code (ID)</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Biometrics</th>
                    <th>Status</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="activity-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.notes || 'No notes'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{member.admission_no}</td>
                      <td>{member.phone || '—'}</td>
                      <td>{member.department || 'Fitness'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)' }}>
                          {getVerificationIcon(member.active, member.next_due_date)}
                          <span style={{ fontSize: 12 }}>
                            {new Date(member.next_due_date) < new Date() || !member.active ? 'Expired / Blocked' : 'Face + Finger'}
                          </span>
                        </div>
                      </td>
                      <td>{getStatusBadge(member)}</td>
                      <td style={{ fontSize: 13, fontWeight: 500, color: new Date(member.next_due_date) < new Date() ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                        {member.next_due_date ? member.next_due_date.split('T')[0] : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" title="Edit" onClick={() => openEditModal(member)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon" title="Delete" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(member.id, member.name)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <Users size={40} className="empty-state-icon" />
                          <p className="empty-state-text">No member records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add / Edit Member Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <form className="modal" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>
                  {editingMember ? (
                    <Edit2 size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  ) : (
                    <UserPlus size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  )}
                  {editingMember ? 'Edit Gym Member' : 'Add New Gym Member'}
                </h2>
                <button type="button" className="btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
              <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className="form-input"
                      placeholder="Enter full name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admission ID (Device PIN) *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 0001"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      required
                      disabled={!!editingMember || isSaving} // ID shouldn't be edited once linked on device
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      disabled={isSaving}
                    >
                      <option value="Fitness">Fitness</option>
                      <option value="Yoga">Yoga</option>
                      <option value="CrossFit">CrossFit</option>
                      <option value="Zumba">Zumba</option>
                      <option value="Swimming">Swimming</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formActive}
                          onChange={(e) => setFormActive(e.target.checked)}
                          style={{ accentColor: 'var(--accent-cyan)' }}
                          disabled={isSaving}
                        />
                        Active Access
                      </label>
                    </div>
                  </div>
              </div>
                <div className="form-group">
                  <label className="form-label">Notes / Email</label>
                  <input
                    className="form-input"
                    placeholder="Optional details or email address"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader className="animate-spin" size={16} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                      {editingMember ? 'Saving...' : 'Enrolling...'}
                    </>
                  ) : (
                    editingMember ? 'Save Changes' : 'Enroll Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
