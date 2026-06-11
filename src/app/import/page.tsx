'use client';

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  FileUp,
  Table2,
} from 'lucide-react';

interface PreviewRow {
  employee_code: string;
  date: string;
  time: string;
  direction: string;
}

const sampleData: PreviewRow[] = [
  { employee_code: '001', date: '2026-06-11', time: '09:02:15', direction: 'Check In' },
  { employee_code: '002', date: '2026-06-11', time: '09:15:32', direction: 'Check In' },
  { employee_code: '003', date: '2026-06-11', time: '09:32:45', direction: 'Check In' },
  { employee_code: '001', date: '2026-06-11', time: '20:15:30', direction: 'Check Out' },
  { employee_code: '002', date: '2026-06-11', time: '20:45:10', direction: 'Check Out' },
];

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setImported(false);
    // Simulate parsing preview
    setPreview(sampleData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImported(true);
    }, 2000);
  };

  return (
    <>
      <Header title="Import Data" subtitle="Import attendance data from CSV or Excel files" />
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">
            <Upload size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Import Attendance Data
          </h2>
          <button className="btn btn-secondary">
            <Download size={16} /> Download Template
          </button>
        </div>

        {/* Upload Zone */}
        <div className="glass-card" style={{ padding: 0, marginBottom: 24 }}>
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <FileUp size={48} className="upload-zone-icon" />
            <p className="upload-zone-text">
              {file ? file.name : 'Drop your CSV or Excel file here'}
            </p>
            <p className="upload-zone-hint">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB — Click to change`
                : 'Supports .csv, .xlsx, .xls formats — or click to browse'}
            </p>
          </div>
        </div>

        {/* File Info */}
        {file && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: 'var(--accent-blue)',
            }}>
              <FileSpreadsheet size={16} />
              {file.name}
            </div>
            <button
              className="btn-icon"
              onClick={() => { setFile(null); setPreview([]); setImported(false); }}
              style={{ color: 'var(--accent-red)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Column Mapping Info */}
        {preview.length > 0 && !imported && (
          <>
            <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Table2 size={16} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Column Mapping</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Employee Code Column</label>
                  <select className="form-select">
                    <option>Column A — employee_code</option>
                    <option>Column B — date</option>
                    <option>Column C — time</option>
                    <option>Column D — direction</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date Column</label>
                  <select className="form-select">
                    <option>Column B — date</option>
                    <option>Column A — employee_code</option>
                    <option>Column C — time</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Time Column</label>
                  <select className="form-select">
                    <option>Column C — time</option>
                    <option>Column B — date</option>
                    <option>Column D — direction</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Direction Column</label>
                  <select className="form-select">
                    <option>Column D — direction</option>
                    <option>Column C — time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="glass-card section-card" style={{ marginBottom: 16 }}>
              <div className="section-header">
                <h3 className="section-title">Preview ({preview.length} records)</h3>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Employee Code</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.employee_code}</td>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 500 }}>{row.time}</td>
                        <td>
                          <span className={`badge ${row.direction.includes('In') ? 'present' : 'absent'}`}>
                            {row.direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => { setFile(null); setPreview([]); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Import {preview.length} Records
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Success State */}
        {imported && (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
            <CheckCircle size={56} style={{ color: 'var(--accent-green)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Import Successful!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              {sampleData.length} attendance records have been imported successfully.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setFile(null); setPreview([]); setImported(false); }}>
                Import More
              </button>
              <button className="btn btn-primary" onClick={() => window.location.href = '/attendance'}>
                View Attendance
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!file && (
          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--accent-amber)', verticalAlign: 'middle' }} />
              Import Guidelines
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
              <li>File must be in <strong>CSV</strong> or <strong>Excel (.xlsx)</strong> format</li>
              <li>Required columns: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>employee_code</code>, <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>date</code>, <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>time</code></li>
              <li>Date format: <strong>YYYY-MM-DD</strong> (e.g., 2026-06-11)</li>
              <li>Time format: <strong>HH:MM:SS</strong> (24-hour, e.g., 09:30:00)</li>
              <li>Employee codes must match member records in the system</li>
              <li>Duplicate records (same code + date + time) will be skipped</li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
