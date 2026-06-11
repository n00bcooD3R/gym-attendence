// ============================================================================
// Type Definitions for Gym Attendance Management System
// ============================================================================

// --- Device Types ---
export interface Device {
  id: string;
  device_name: string;
  serial_number: string;
  mac_address?: string;
  device_direction: string;
  firmware_version?: string;
  last_ping: string | null;
  last_reset: string | null;
  is_online: boolean;
  location?: string;
  activation_code?: string;
  transaction_stamp: string;
  op_stamp: string;
  created_at: string;
  updated_at: string;
}

// --- Member Types ---
export interface Member {
  id: string;
  name: string;
  admission_no: string; // The PIN/Code registered on the biometric device
  phone: string;
  photo_url?: string;
  address?: string;
  dob?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  join_date: string;
  fee_amount?: number;
  fee_cycle_days?: number;
  next_due_date: string; // Expiration date
  last_payment_date?: string;
  is_pt_client?: boolean;
  active: boolean;
  department?: string;
  notes?: string;
  created_at: string;
}

// --- Attendance Types ---
export interface AttendanceLog {
  id: string;
  member_id: string;
  punch_time: string;
  device_name?: string;
  is_expired_access: boolean; // Flagged if punch date > next_due_date
  created_at: string;
  // UI helper fields (joined from members):
  member_name?: string;
  admission_no?: string;
}

export interface DailyAttendance {
  id: string;
  member_id: string;
  date: string;
  first_in: string | null;
  last_out: string | null;
  total_hours: number;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'holiday' | 'leave';
  punch_count: number;
  member_name?: string;
}

// --- Device Command Types ---
export interface DeviceCommand {
  id: string;
  device_id: string;
  command: string;
  command_type: string;
  title: string;
  status: 'pending' | 'sent' | 'executed' | 'failed';
  created_at: string;
  executed_at: string | null;
}

// --- Shift Types ---
export interface Shift {
  id: string;
  code: string;
  name: string;
  begin_time: string;
  end_time: string;
  full_day_duration: number;
  late_threshold_minutes: number;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  totalMembers: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  devicesOnline: number;
  devicesOffline: number;
}

// --- ADMS Protocol Types ---
export interface ADMSAttendanceRecord {
  pin: string;
  time: string;
  status: string;
  verify: string;
  workCode: string;
  reserved1: string;
  reserved2: string;
}

export interface ADMSOperationRecord {
  opCode: string;
  opTime: string;
  adminId: string;
  object1: string;
  object2: string;
  object3: string;
  object4: string;
}

// --- Import Types ---
export interface ImportRecord {
  employee_code: string;
  date: string;
  time: string;
  direction?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

// --- Report Types ---
export interface AttendanceReportRow {
  member_name: string;
  employee_code: string;
  date: string;
  first_in: string;
  last_out: string;
  total_hours: string;
  status: string;
}

// --- Chart Data ---
export interface ChartDataPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
}

// --- Verification Type Map ---
export const VERIFICATION_TYPES: Record<string, string> = {
  '0': 'Password',
  '1': 'Fingerprint',
  '2': 'Card',
  '3': 'Password',
  '4': 'Card',
  '9': 'Password',
  '15': 'Face',
  '16': 'Face + Finger',
  '17': 'Face + Password',
  '18': 'Face + Card',
  '25': 'Palm',
};

// --- Direction Map ---
export const DIRECTION_MAP: Record<string, string> = {
  '0': 'Check In',
  '1': 'Check Out',
  '2': 'Break Out',
  '3': 'Break In',
  '4': 'OT In',
  '5': 'OT Out',
};
