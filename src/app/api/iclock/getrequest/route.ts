// ============================================================================
// ADMS Push Protocol — /iclock/getrequest
// Device polls for pending commands
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { formatDeviceCommand } from '@/lib/adms-parser';
import { dbUpsertDevice, dbGetPendingCommands, dbMarkCommandSent } from '@/lib/db-client';

/**
 * GET /api/iclock/getrequest?SN=xxx
 * Device asks "do you have commands for me?"
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';

  console.log(`[ADMS] getrequest from device SN: ${serialNumber}`);

  if (!serialNumber) {
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Register / track device heartbeat ping
  try {
    await dbUpsertDevice(serialNumber);
  } catch (err) {
    console.error('[ADMS] Heartbeat register failed:', err);
  }

  // Check for pending commands
  let commands: any[] = [];
  try {
    commands = await dbGetPendingCommands();
  } catch (err) {
    console.error('[ADMS] Error reading command queue:', err);
  }

  if (!commands || commands.length === 0) {
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Format commands and mark as sent
  const commandLines: string[] = [];
  for (const cmd of commands) {
    commandLines.push(formatDeviceCommand(cmd.id.toString(), cmd.command));
    
    try {
      // Mark command as sent so it is not double-sent
      await dbMarkCommandSent(parseInt(cmd.id));
    } catch (err) {
      console.error(`[ADMS] Failed to mark command ${cmd.id} as sent:`, err);
    }
  }

  console.log(`[ADMS] Pushed ${commandLines.length} commands to SN ${serialNumber}`);

  return new NextResponse(commandLines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
