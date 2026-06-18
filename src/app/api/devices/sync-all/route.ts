import { NextResponse } from 'next/server';
import { dbGetMembers, dbQueueCommand } from '@/lib/db-client';

/**
 * POST /api/devices/sync-all
 * Queues DATA UPDATE USERINFO commands for every member in the database.
 * This is a full bulk re-sync to fix device/database mismatches.
 */
export async function POST() {
  try {
    const members = await dbGetMembers();

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No members found in database' }, { status: 404 });
    }

    let queued = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of members) {
      // Only sync members that have an admission_no (device PIN)
      if (!member.admission_no) {
        skipped++;
        continue;
      }

      const pin = member.admission_no.trim();
      const name = member.name.trim();
      const joinDate = member.join_date
        ? member.join_date.split('T')[0]
        : new Date().toISOString().split('T')[0];
      const endDate = member.next_due_date
        ? member.next_due_date.split('T')[0]
        : '2099-12-31';

      // Build the ADMS command
      // Format: DATA UPDATE USERINFO PIN=xxxx\tName=xxxx\tPri=0\tStartDatetime=YYYY-MM-DD 00:00:00\tEndDatetime=YYYY-MM-DD 23:59:59
      const command = member.active
        ? `DATA UPDATE USERINFO PIN=${pin}\tName=${name}\tPri=0\tStartDatetime=${joinDate} 00:00:00\tEndDatetime=${endDate} 23:59:59`
        : `DATA DELETE user PIN=${pin}`;

      try {
        await dbQueueCommand(
          'bulk-sync',
          command,
          'sync_user',
          member.active ? `Bulk Sync: ${name}` : `Bulk Remove: ${name}`
        );
        queued++;
      } catch (err: any) {
        errors.push(`${name} (${pin}): ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: members.length,
      queued,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Queued ${queued} sync commands. Device will receive them on next heartbeat poll.`,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
