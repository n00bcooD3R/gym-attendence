// ============================================================================
// ADMS Push Protocol — /iclock/getrequest
// Device polls for pending commands
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatDeviceCommand } from '@/lib/adms-parser';

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

  const supabase = createServerClient();

  // Track device heartbeat ping
  try {
    await supabase
      .from('devices')
      .update({ last_ping: new Date().toISOString() })
      .eq('serial_number', serialNumber);
  } catch (err) {
    console.error('[ADMS] Heartbeat track failed:', err);
  }

  // Check for pending commands using your actual column 'executed'
  const { data: commands, error } = await supabase
    .from('device_commands')
    .select('*')
    .eq('executed', false)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) {
    console.error('[ADMS] Error reading command queue:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (!commands || commands.length === 0) {
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Format commands and mark as sent/executed
  const commandLines: string[] = [];
  for (const cmd of commands) {
    commandLines.push(formatDeviceCommand(cmd.id, cmd.command));
    
    // Mark command as executed so it is not double-sent
    await supabase
      .from('device_commands')
      .update({ executed: true })
      .eq('id', cmd.id);
  }

  console.log(`[ADMS] Pushed ${commandLines.length} commands to SN ${serialNumber}`);

  return new NextResponse(commandLines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
