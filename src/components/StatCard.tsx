'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan';
}

export default function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className={`glass-card stat-card ${color}`}>
      <div className={`stat-card-icon ${color}`}>{icon}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
