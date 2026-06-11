// ============================================================================
// ADMS Push Protocol — /iclock/ping
// Device heartbeat endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/iclock/ping?SN=xxx
 * Device heartbeat — updates last_ping timestamp
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';

  console.log(`[ADMS] Ping from device: ${serialNumber}`);

  if (serialNumber) {
    const supabase = createServerClient();
    await supabase
      .from('devices')
      .update({ last_ping: new Date().toISOString() })
      .eq('serial_number', serialNumber);
  }

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
