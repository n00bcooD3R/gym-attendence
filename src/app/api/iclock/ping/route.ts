// ============================================================================
// ADMS Push Protocol — /iclock/ping
// Device heartbeat endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { dbUpsertDevice } from '@/lib/db-client';

/**
 * GET /api/iclock/ping?SN=xxx
 * Device heartbeat — updates last_ping timestamp (and registers device if new)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';

  console.log(`[ADMS] Ping from device: ${serialNumber}`);

  if (serialNumber) {
    try {
      await dbUpsertDevice(serialNumber);
    } catch (err) {
      console.error('[ADMS] Ping registration update failed:', err);
    }
  }

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
