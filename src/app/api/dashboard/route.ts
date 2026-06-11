import { NextRequest, NextResponse } from 'next/server';
import { dbGetMembers, dbGetAttendance, dbGetDevices } from '@/lib/db-client';
import { startOfDay, format, subDays, isAfter } from 'date-fns';

/**
 * GET /api/dashboard
 * Aggregates statistics, chart data, and recent activity for the dashboard
 */
export async function GET() {
  try {
    const members = await dbGetMembers();
    const devices = await dbGetDevices();
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = await dbGetAttendance(todayStr);
    const allLogs = await dbGetAttendance();

    // 1. Devices Stats
    const devicesOnline = devices.filter(d => d.is_online).length;
    const devicesOffline = devices.length - devicesOnline;

    // 2. Members Stats
    const activeMembers = members.filter(m => m.active);
    const totalMembers = activeMembers.length;

    // 3. Attendance Stats for Today
    // Find unique members present today (verified successfully without expired access)
    const presentTodayUserIds = new Set(
      todayLogs
        .filter(log => !log.is_expired_access)
        .map(log => log.member_id)
    );
    const presentToday = presentTodayUserIds.size;
    const absentToday = Math.max(0, totalMembers - presentToday);

    // Late Arrivals (arbitrary cutoff: after 09:30 AM local time)
    let lateToday = 0;
    const lateCutoff = '09:30:00';
    
    // Check first check-in of each user today
    const userFirstPunch: Record<string, string> = {};
    todayLogs
      .filter(log => !log.is_expired_access)
      .forEach(log => {
        const timePart = new Date(log.punch_time).toLocaleTimeString('en-US', { hour12: false });
        if (!userFirstPunch[log.member_id] || timePart < userFirstPunch[log.member_id]) {
          userFirstPunch[log.member_id] = timePart;
        }
      });
    
    Object.values(userFirstPunch).forEach(timeStr => {
      if (timeStr > lateCutoff) {
        lateToday++;
      }
    });

    // 4. Recent Activity (latest 15 punches, including expired access attempts)
    const recentActivity = allLogs.slice(0, 15).map((log, index) => {
      const pDate = new Date(log.punch_time);
      const formattedTime = pDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      // Infer direction based on punch count (simple mock fallback if direction field is not standard)
      // Usually index odd is check-out, even is check-in
      const punchCount = allLogs.filter(l => l.member_id === log.member_id && new Date(l.punch_time) <= pDate).length;
      const direction = punchCount % 2 === 1 ? 'in' : 'out';

      let action = direction === 'in' ? 'Check In' : 'Check Out';
      if (log.is_expired_access) {
        action = 'Expired Access Blocked';
      }

      return {
        id: log.id,
        name: log.member_name || 'Member',
        code: log.admission_no || 'N/A',
        action,
        method: 'Face', // Mock method display (eSSL X2008 defaults to Face/Fingerprint)
        time: formattedTime,
        direction,
        is_expired_access: log.is_expired_access,
      };
    });

    // 5. Weekly Trend Chart Data (Last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const label = format(day, 'EEE');

      // Fetch logs for that specific day
      // (Since dbGetAttendance date filter parses the start and end of that day)
      const dayLogs = allLogs.filter(log => log.punch_time.startsWith(dayStr));
      const dayPunches = new Set(dayLogs.filter(l => !l.is_expired_access).map(l => l.member_id)).size;
      const dayLate = dayLogs.filter(log => {
        if (log.is_expired_access) return false;
        const timePart = new Date(log.punch_time).toLocaleTimeString('en-US', { hour12: false });
        return timePart > lateCutoff;
      }).length;

      chartData.push({
        date: label,
        present: dayPunches,
        absent: Math.max(0, totalMembers - dayPunches),
        late: dayLate,
      });
    }

    return NextResponse.json({
      stats: {
        totalMembers,
        presentToday,
        absentToday,
        lateToday,
        devicesOnline,
        devicesOffline,
      },
      recentActivity,
      chartData,
      devices: devices.map(d => ({
        name: d.device_name,
        serial: d.serial_number,
        status: d.is_online ? 'online' : 'offline',
        lastPing: d.last_ping ? format(new Date(d.last_ping), 'yyyy-MM-dd HH:mm:ss') : 'Never',
        firmware: d.firmware_version || 'N/A',
      })),
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
