// ============================================================================
// ADMS Push Protocol — /iclock/cdata
// Receives attendance logs, operation logs, and user data from device
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseAttendanceLogs, parseOperationLogs, buildRegistryOptions } from '@/lib/adms-parser';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/iclock/cdata?SN=xxx
 * Device handshake — returns registry options
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';

  console.log(`[ADMS] cdata GET handshake from device: ${serialNumber}`);

  const supabase = createServerClient();

  // Upsert device record
  if (serialNumber) {
    try {
      await supabase.from('devices').upsert(
        {
          serial_number: serialNumber,
          device_name: `Device-${serialNumber.slice(-6)}`,
          last_ping: new Date().toISOString(),
          transaction_stamp: '0',
          op_stamp: '0',
        },
        { onConflict: 'serial_number' }
      );
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
 * Receives attendance data from device
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';
  const table = searchParams.get('table') || '';
  const stamp = searchParams.get('Stamp') || '0';

  const body = await request.text();
  console.log(`[ADMS] cdata POST from SN ${serialNumber}, table=${table}, stamp=${stamp}`);

  const supabase = createServerClient();

  // Update device ping timestamp
  if (serialNumber) {
    try {
      await supabase
        .from('devices')
        .update({ last_ping: new Date().toISOString() })
        .eq('serial_number', serialNumber);
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

          // 1. Look up the member by admission_no or device_user_id to evaluate validity
          const { data: members, error: memberErr } = await supabase
            .from('members')
            .select('id, name, next_due_date, active, device_user_id, admission_no');

          if (memberErr || !members) {
            console.error(`[ADMS] Error fetching members list:`, memberErr);
            continue;
          }

          // Map match using zero-stripped strings
          const member = members.find(m => {
            const mPin = m.device_user_id ? m.device_user_id.trim().replace(/^0+/, '') : '';
            const mAdm = m.admission_no ? m.admission_no.trim().replace(/^0+/, '') : '';
            return (mPin && mPin === cleanPin) || (mAdm && mAdm === cleanPin);
          });

          let isExpiredAccess = false;
          if (member) {
            // Validate membership expiry (next_due_date acts as expiration date)
            const todayStr = new Date().toISOString().split('T')[0];
            const expiryStr = member.next_due_date || '1970-01-01';
            
            const isExpired = expiryStr < todayStr;
            const isInactive = !member.active;
            isExpiredAccess = isExpired || isInactive;

            if (isExpiredAccess) {
              console.log(`[ADMS] 🚫 Expired/Inactive punch attempt by ${member.name} (PIN: ${cleanPin}). Expired: ${isExpired}, Inactive: ${isInactive}`);
            }
          } else {
            console.warn(`[ADMS] ⚠️ Biometric PIN '${cleanPin}' did not match any registered member.`);
          }

          // 2. Prevent duplicate punches (same user at the exact same punch_time)
          const { data: existing } = await supabase
            .from('attendance_logs')
            .select('id')
            .eq('device_user_id', cleanPin)
            .eq('punch_time', punchTime)
            .maybeSingle();

          if (!existing) {
            // 3. Insert punch record into the actual attendance_logs table
            const { error: insertErr } = await supabase
              .from('attendance_logs')
              .insert({
                device_sn: serialNumber,
                device_user_id: cleanPin,
                punch_time: punchTime,
                is_expired_access: isExpiredAccess,
              });

            if (insertErr) {
              console.error(`[ADMS] Failed to save attendance:`, insertErr);
            } else {
              console.log(`[ADMS] ✅ Synced punch: PIN #${cleanPin} at ${punchTime} (Expired Access: ${isExpiredAccess})`);
            }
          } else {
            console.log(`[ADMS] ⏭️ Ignored duplicate punch: PIN #${cleanPin} at ${punchTime}`);
          }
        } catch (err) {
          console.error('[ADMS] Failed to process record:', record, err);
        }
      }
    }
  } else if (table === 'OPERLOG' && body.trim()) {
    // Parse and store operation logs
    try {
      const records = parseOperationLogs(body);
      console.log(`[ADMS] Parsed ${records.length} operation records`);

      for (const record of records) {
        await supabase.from('device_op_logs').insert({
          op_code: record.opCode,
          op_date: record.opTime,
        });
      }
    } catch (err) {
      console.error('[ADMS] Operation log sync failed:', err);
    }
  }

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
