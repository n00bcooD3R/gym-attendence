import fs from 'fs';
import path from 'path';
import { createServerClient } from './supabase';
import { Member, AttendanceLog } from './types';

const DB_FILE = path.join(process.cwd(), 'local_db.json');

// Initial seed data for the local fallback DB
const defaultMembers: Member[] = [
  { id: '1', name: 'Rahul Sharma', admission_no: '0001', phone: '9876543210', active: true, join_date: '2025-01-15', next_due_date: '2027-01-15', created_at: new Date().toISOString() },
  { id: '2', name: 'Priya Patel', admission_no: '0002', phone: '9876543211', active: true, join_date: '2025-02-01', next_due_date: '2027-02-01', created_at: new Date().toISOString() },
  { id: '3', name: 'Amit Kumar', admission_no: '0003', phone: '9876543212', active: true, join_date: '2025-03-10', next_due_date: '2027-03-10', created_at: new Date().toISOString() },
  { id: '4', name: 'Sneha Reddy', admission_no: '0004', phone: '9876543213', active: false, join_date: '2024-06-20', next_due_date: '2025-06-20', created_at: new Date().toISOString() },
  { id: '5', name: 'Vikram Singh', admission_no: '0005', phone: '9876543214', active: true, join_date: '2025-04-01', next_due_date: '2027-04-01', created_at: new Date().toISOString() },
  { id: '6', name: 'Ananya Joshi', admission_no: '0006', phone: '9876543215', active: true, join_date: '2025-05-15', next_due_date: '2026-05-15', created_at: new Date().toISOString() },
  { id: '7', name: 'Rajesh Gupta', admission_no: '0007', phone: '9876543216', active: true, join_date: '2024-01-01', next_due_date: '2025-01-01', created_at: new Date().toISOString() }, // Expired
  { id: '8', name: 'Deepa Nair', admission_no: '0008', phone: '9876543217', active: true, join_date: '2025-06-01', next_due_date: '2027-06-01', created_at: new Date().toISOString() },
];

const defaultAttendance: AttendanceLog[] = [
  { id: 'a1', member_id: '1', punch_time: '2026-06-11T09:02:15.000Z', device_name: 'eSSL X2008', is_expired_access: false, created_at: new Date().toISOString(), member_name: 'Rahul Sharma', admission_no: '0001' },
  { id: 'a2', member_id: '2', punch_time: '2026-06-11T09:15:32.000Z', device_name: 'eSSL X2008', is_expired_access: false, created_at: new Date().toISOString(), member_name: 'Priya Patel', admission_no: '0002' },
  { id: 'a3', member_id: '3', punch_time: '2026-06-11T09:32:45.000Z', device_name: 'eSSL X2008', is_expired_access: false, created_at: new Date().toISOString(), member_name: 'Amit Kumar', admission_no: '0003' },
  { id: 'a4', member_id: '4', punch_time: '2026-06-11T20:45:10.000Z', device_name: 'eSSL X2008', is_expired_access: true, created_at: new Date().toISOString(), member_name: 'Sneha Reddy', admission_no: '0004' },
  { id: 'a5', member_id: '5', punch_time: '2026-06-11T10:05:22.000Z', device_name: 'eSSL X2008', is_expired_access: false, created_at: new Date().toISOString(), member_name: 'Vikram Singh', admission_no: '0005' },
  { id: 'a6', member_id: '6', punch_time: '2026-06-11T09:48:55.000Z', device_name: 'eSSL X2008', is_expired_access: false, created_at: new Date().toISOString(), member_name: 'Ananya Joshi', admission_no: '0006' },
  { id: 'a7', member_id: '7', punch_time: '2026-06-11T19:30:18.000Z', device_name: 'eSSL X2008', is_expired_access: true, created_at: new Date().toISOString(), member_name: 'Rajesh Gupta', admission_no: '0007' },
  { id: 'a8', member_id: '8', punch_time: '2026-06-11T09:10:40.000Z', device_name: 'eSSL X2008', is_expired_access: false, created_at: new Date().toISOString(), member_name: 'Deepa Nair', admission_no: '0008' },
];

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url.length > 0 && !url.includes('your-project') && !key.includes('your-anon-key');
}

function loadLocalDB() {
  if (!fs.existsSync(DB_FILE)) {
    const data = { members: defaultMembers, attendance: defaultAttendance, devices: [], commands: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing local DB file, resetting:', err);
    const data = { members: defaultMembers, attendance: defaultAttendance, devices: [], commands: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

function saveLocalDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function dbGetMembers(): Promise<Member[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) {
        return data as Member[];
      }
      console.warn('[DATABASE] Supabase fetch error, using local fallback:', error);
    } catch (err) {
      console.warn('[DATABASE] Supabase query exception, using local fallback:', err);
    }
  }
  return loadLocalDB().members;
}

export async function dbAddMember(member: Omit<Member, 'id' | 'created_at'>): Promise<Member> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('members')
        .insert({
          name: member.name,
          admission_no: member.admission_no,
          phone: member.phone,
          join_date: member.join_date,
          next_due_date: member.next_due_date,
          active: member.active,
          photo_url: member.photo_url || null,
          address: member.address || null,
          notes: member.notes || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        return data as Member;
      }
      console.error('[DATABASE] Supabase insert error:', error);
      throw error || new Error('Insert failed');
    } catch (err) {
      console.warn('[DATABASE] Supabase exception on add, falling back to local:', err);
    }
  }

  // Fallback to local DB
  const db = loadLocalDB();
  const newMember: Member = {
    ...member,
    id: Math.random().toString(36).substring(2, 11),
    created_at: new Date().toISOString(),
  };
  db.members.push(newMember);
  saveLocalDB(db);

  // If local simulation has a device, queue command in local commands
  const device = db.devices?.[0];
  if (device) {
    const cmdStr = `DATA UPDATE USERINFO PIN=${newMember.admission_no}\tName=${newMember.name}\tPri=0\tStartDatetime=${newMember.join_date} 00:00:00\tEndDatetime=${newMember.next_due_date} 23:59:59`;
    db.commands = db.commands || [];
    db.commands.push({
      id: db.commands.length + 1,
      command: cmdStr,
      executed: false,
      created_at: new Date().toISOString(),
    });
    saveLocalDB(db);
  }

  return newMember;
}

export async function dbUpdateMember(id: string, member: Partial<Member>): Promise<Member> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('members')
        .update(member)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        return data as Member;
      }
      console.error('[DATABASE] Supabase update error:', error);
      throw error || new Error('Update failed');
    } catch (err) {
      console.warn('[DATABASE] Supabase exception on update, falling back to local:', err);
    }
  }

  // Fallback to local DB
  const db = loadLocalDB();
  const index = db.members.findIndex((m: Member) => m.id === id);
  if (index === -1) throw new Error('Member not found');

  const updatedMember = { ...db.members[index], ...member };
  db.members[index] = updatedMember;
  saveLocalDB(db);

  // Queue update command in local DB
  const device = db.devices?.[0];
  if (device) {
    const cmdStr = updatedMember.active 
      ? `DATA UPDATE USERINFO PIN=${updatedMember.admission_no}\tName=${updatedMember.name}\tPri=0\tStartDatetime=${updatedMember.join_date} 00:00:00\tEndDatetime=${updatedMember.next_due_date} 23:59:59`
      : `DATA DELETE user PIN=${updatedMember.admission_no}`;
    
    db.commands = db.commands || [];
    db.commands.push({
      id: db.commands.length + 1,
      command: cmdStr,
      executed: false,
      created_at: new Date().toISOString(),
    });
    saveLocalDB(db);
  }

  return updatedMember;
}

export async function dbDeleteMember(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (!error) {
        return true;
      }
      console.error('[DATABASE] Supabase delete error:', error);
      throw error || new Error('Delete failed');
    } catch (err) {
      console.warn('[DATABASE] Supabase exception on delete, falling back to local:', err);
    }
  }

  // Fallback to local DB
  const db = loadLocalDB();
  const index = db.members.findIndex((m: Member) => m.id === id);
  if (index === -1) return false;

  const deletedMember = db.members[index];
  db.members.splice(index, 1);
  saveLocalDB(db);

  // Queue delete command in local DB
  const device = db.devices?.[0];
  if (device) {
    const cmdStr = `DATA DELETE user PIN=${deletedMember.admission_no}`;
    db.commands = db.commands || [];
    db.commands.push({
      id: db.commands.length + 1,
      command: cmdStr,
      executed: false,
      created_at: new Date().toISOString(),
    });
    saveLocalDB(db);
  }

  return true;
}

export async function dbGetAttendance(dateFilter?: string): Promise<AttendanceLog[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      
      // Query raw logs from attendance_logs
      let logsQuery = supabase.from('attendance_logs').select('*');
      if (dateFilter) {
        const start = `${dateFilter}T00:00:00.000Z`;
        const end = `${dateFilter}T23:59:59.999Z`;
        logsQuery = logsQuery.gte('punch_time', start).lte('punch_time', end);
      }
      const { data: logs, error: logsErr } = await logsQuery.order('punch_time', { ascending: false });

      // Query members to perform in-memory join (since there is no FK relationship)
      const { data: members, error: membersErr } = await supabase
        .from('members')
        .select('id, name, admission_no, device_user_id');

      if (!logsErr && logs && !membersErr && members) {
        return logs.map(log => {
          // Find matching member by device_user_id (biometric PIN) ignoring leading zeros
          const cleanPin = log.device_user_id ? log.device_user_id.trim().replace(/^0+/, '') : '';
          const member = members.find(m => {
            const mPin = m.device_user_id ? m.device_user_id.trim().replace(/^0+/, '') : '';
            const mAdm = m.admission_no ? m.admission_no.trim().replace(/^0+/, '') : '';
            return (mPin && mPin === cleanPin) || (mAdm && mAdm === cleanPin);
          });

          return {
            id: log.id.toString(),
            member_id: member ? member.id : '',
            punch_time: log.punch_time,
            device_name: log.device_sn ? `Device-${log.device_sn.slice(-6)}` : 'ADMS Device',
            is_expired_access: log.is_expired_access || false,
            created_at: log.created_at,
            member_name: member ? member.name : 'Unknown Biometric',
            admission_no: member ? member.admission_no : cleanPin,
          };
        }) as AttendanceLog[];
      }
      console.warn('[DATABASE] Supabase attendance fetch error:', logsErr || membersErr);
    } catch (err) {
      console.warn('[DATABASE] Supabase attendance exception:', err);
    }
  }

  // Fallback to local DB
  const db = loadLocalDB();
  let list = db.attendance;
  if (dateFilter) {
    list = list.filter((log: AttendanceLog) => log.punch_time.startsWith(dateFilter));
  }
  return list;
}

export async function dbGetDevices(): Promise<any[]> {
  const defaultDevice = {
    id: 'd1',
    device_name: 'eSSL X2008',
    serial_number: 'NYU7260400977',
    mac_address: '00:17:61:10:32:f6',
    firmware_version: 'ZAM70-NF24HA-Ver3.3.12',
    last_ping: new Date().toISOString(),
    is_online: true,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('devices').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        return data.map(d => {
          const isOnline = d.last_ping ? (new Date().getTime() - new Date(d.last_ping).getTime() < 120000) : false;
          return { ...d, is_online: isOnline };
        });
      }
    } catch (err) {
      console.warn('[DATABASE] Supabase devices exception:', err);
    }
  }

  // Fallback
  const db = loadLocalDB();
  db.devices = db.devices || [];
  if (db.devices.length === 0) {
    db.devices.push(defaultDevice);
    saveLocalDB(db);
    return [defaultDevice];
  }
  return db.devices.map((d: any) => {
    const isOnline = d.last_ping ? (new Date().getTime() - new Date(d.last_ping).getTime() < 120000) : false;
    return { ...d, is_online: isOnline };
  });
}

export async function dbGetCommands(): Promise<any[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('device_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        // Map table schema column 'executed' to UI 'status' representation
        return data.map(c => ({
          id: c.id.toString(),
          command: c.command,
          status: c.executed ? 'executed' : 'pending',
          created_at: c.created_at,
          title: c.command.includes('DELETE') ? 'Delete User' : c.command.includes('UPDATE') ? 'Sync User' : 'Device Command',
        }));
      }
    } catch (err) {
      console.warn('[DATABASE] Supabase commands exception:', err);
    }
  }

  const db = loadLocalDB();
  return (db.commands || []).slice().reverse().map((c: any) => ({
    ...c,
    status: c.executed ? 'executed' : 'pending',
  }));
}

export async function dbQueueCommand(deviceId: string, command: string, commandType: string, title: string): Promise<any> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('device_commands')
        .insert({
          command,
          executed: false,
        })
        .select('*')
        .single();
      
      if (!error && data) {
        return {
          id: data.id.toString(),
          command: data.command,
          status: 'pending',
          created_at: data.created_at,
          title,
        };
      }
      console.error('[DATABASE] Supabase command queue error:', error);
      throw error || new Error('Command queuing failed');
    } catch (err) {
      console.warn('[DATABASE] Supabase command exception, falling back:', err);
    }
  }

  const db = loadLocalDB();
  db.commands = db.commands || [];
  const newCmd = {
    id: db.commands.length + 1,
    command,
    executed: false,
    created_at: new Date().toISOString(),
  };
  db.commands.push(newCmd);
  saveLocalDB(db);
  return {
    ...newCmd,
    status: 'pending',
    title,
  };
}
