// ============================================================================
// ADMS Push Protocol — /iclock/cdata
// Receives attendance logs, operation logs, and user data from device
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseAttendanceLogs, parseOperationLogs, parseUserInfo, buildRegistryOptions } from '@/lib/adms-parser';
import { 
  dbGetMembers, 
  dbAddAttendanceLog, 
  dbCheckDuplicateAttendance, 
  dbUpsertDevice, 
  dbPingDevice, 
  dbSyncUserFromDevice 
} from '@/lib/db-client';

/**
 * GET /api/iclock/cdata?SN=xxx
 * Device handshake — returns registry options
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';

  console.log(`[ADMS] cdata GET handshake from device: ${serialNumber}`);

  // Upsert device record
  if (serialNumber) {
    try {
      await dbUpsertDevice(serialNumber);
    } catch (err) {
      console.error('[ADMS] Failed to upsert device:', err);
    }
  }

  // Returns configuration options (e.g. telling device what logs to push)
  const options = buildRegistryOptions(serialNumber);

  return new NextResponse(options, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * POST /api/iclock/cdata?SN=xxx&table=ATTLOG&Stamp=xxx
 * Receives attendance data and user enrollments from device
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';
  const table = searchParams.get('table') || '';
  const stamp = searchParams.get('Stamp') || '0';

  const body = await request.text();
  console.log(`[ADMS] cdata POST from SN ${serialNumber}, table=${table}, stamp=${stamp}`);

  // Update device ping timestamp
  if (serialNumber) {
    try {
      await dbPingDevice(serialNumber);
    } catch (err) {
      console.error('[ADMS] Device ping update failed:', err);
    }
  }

  if (table === 'ATTLOG' && body.trim()) {
    // Parse and store attendance logs
    const records = parseAttendanceLogs(body);
    console.log(`[ADMS] Parsed ${records.length} raw attendance records`);

    for (const record of records) {
      if (record.pin && record.time) {
        try {
          // Format date/time
          const punchTime = new Date(record.time).toISOString();
          
          // Strip leading zeros to prevent mismatch between "001" and "1"
          const cleanPin = record.pin.trim().replace(/^0+/, '');

          // 1. Look up the member to evaluate validity
          const members = await dbGetMembers();
          
          // Map match using zero-stripped strings
          const member = members.find(m => {
            const mPin = m.device_user_id ? m.device_user_id.trim().replace(/^0+/, '') : '';
            const mAdm = m.admission_no ? m.admission_no.trim().replace(/^0+/, '') : '';
            return (mPin && mPin === cleanPin) || (mAdm && mAdm === cleanPin);
          });

          let isExpiredAccess = false;
          if (member) {
            // Validate membership expiry (staff members have infinite membership)
            const isStaff = !!member.is_staff;
            const todayStr = new Date().toISOString().split('T')[0];
            const expiryStr = member.next_due_date || '1970-01-01';
            
            const isExpired = !isStaff && (expiryStr < todayStr);
            const isInactive = !member.active;
            isExpiredAccess = isExpired || isInactive;

            if (isExpiredAccess) {
              console.log(`[ADMS] 🚫 Expired/Inactive punch attempt by ${member.name} (PIN: ${cleanPin}). Expired: ${isExpired}, Inactive: ${isInactive}`);
            }
          } else {
            console.warn(`[ADMS] ⚠️ Biometric PIN '${cleanPin}' did not match any registered member.`);
          }

          // 2. Prevent duplicate punches (same user at the exact same punch_time)
          const isDuplicate = await dbCheckDuplicateAttendance(cleanPin, punchTime);

          if (!isDuplicate) {
            // 3. Insert punch record
            await dbAddAttendanceLog({
              device_sn: serialNumber,
              device_user_id: cleanPin,
              punch_time: punchTime,
              is_expired_access: isExpiredAccess,
            });
            console.log(`[ADMS] ✅ Synced punch: PIN #${cleanPin} at ${punchTime} (Expired Access: ${isExpiredAccess})`);
          } else {
            console.log(`[ADMS] ⏭️ Ignored duplicate punch: PIN #${cleanPin} at ${punchTime}`);
          }
        } catch (err) {
          console.error('[ADMS] Failed to process record:', record, err);
        }
      }
    }
  } 
  // Handle user data sync from device (whenever user registers on the machine)
  else if ((table.toUpperCase() === 'USERINFO' || table.toUpperCase() === 'USER') && body.trim()) {
    try {
      const records = parseUserInfo(body);
      console.log(`[ADMS] Parsed ${records.length} user info records from device`);

      for (const record of records) {
        const pin = record.PIN || record.pin || '';
        const name = record.Name || record.name || `Device User ${pin}`;

        if (pin) {
          console.log(`[ADMS] Syncing device registered user. PIN: ${pin}, Name: ${name}`);
          const syncedMember = await dbSyncUserFromDevice(pin, name);
          console.log(`[ADMS] Successfully synced user to DB: ${syncedMember.name} (ID: ${syncedMember.admission_no})`);
        }
      }
    } catch (err) {
      console.error('[ADMS] User info sync from device failed:', err);
    }
  }
  else if (table === 'OPERLOG' && body.trim()) {
    // Parse operation logs
    try {
      const records = parseOperationLogs(body);
      console.log(`[ADMS] Parsed ${records.length} operation records`);
    } catch (err) {
      console.error('[ADMS] Operation log parse failed:', err);
    }
  }

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
