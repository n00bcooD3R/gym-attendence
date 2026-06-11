// ============================================================================
// Shared Utilities
// ============================================================================

import { format, parseISO, differenceInMinutes, isToday } from 'date-fns';

/**
 * Format a date string to display format
 */
export function formatDate(dateStr: string | null, fmt: string = 'dd MMM yyyy'): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string to time display
 */
export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'hh:mm a');
  } catch {
    return dateStr;
  }
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}

/**
 * Calculate duration between two times in hours and minutes
 */
export function calculateDuration(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return '—';
  try {
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    const totalMinutes = differenceInMinutes(end, start);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  } catch {
    return '—';
  }
}

/**
 * Check if device is online (pinged within last 5 minutes)
 */
export function isDeviceOnline(lastPing: string | null): boolean {
  if (!lastPing) return false;
  try {
    const pingTime = parseISO(lastPing);
    const diffMinutes = differenceInMinutes(new Date(), pingTime);
    return diffMinutes <= 5;
  } catch {
    return false;
  }
}

/**
 * Check if a date is today
 */
export function checkIsToday(dateStr: string): boolean {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

/**
 * Get attendance status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    present: '#10b981',
    absent: '#ef4444',
    late: '#f59e0b',
    'half-day': '#8b5cf6',
    holiday: '#6366f1',
    leave: '#06b6d4',
  };
  return colors[status] || '#6b7280';
}

/**
 * Get verification type label
 */
export function getVerificationLabel(code: string): string {
  const types: Record<string, string> = {
    '0': 'Password',
    '1': 'Fingerprint',
    '2': 'Card',
    '15': 'Face',
    '16': 'Face+Finger',
    '17': 'Face+Password',
    '18': 'Face+Card',
    '25': 'Palm',
  };
  return types[code] || `Type ${code}`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Classname utility (simplified cn)
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
