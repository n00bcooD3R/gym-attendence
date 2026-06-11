// ============================================================================
// ADMS Push Protocol — /iclock/devicecmd
// Device reports command execution results
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/iclock/devicecmd?SN=xxx
 * Device reports result of a command that was sent
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get('SN') || '';
  const body = await request.text();

  console.log(`[ADMS] devicecmd result from SN ${serialNumber}:`);
  console.log(body.substring(0, 500));

  if (serialNumber && body.trim()) {
    const supabase = createServerClient();
    
    // Parse command results - format: "ID:Return:CMD_VALUE"
    const lines = body.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^ID(\d+)/);
      if (match) {
        const commandId = match[1];
        const isSuccess = line.includes('Return=0') || line.includes('result=0');
        console.log(`[ADMS] Command ID ${commandId} result: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        try {
          // Update executed flag in device_commands
          await supabase
            .from('device_commands')
            .update({ executed: isSuccess })
            .eq('id', parseInt(commandId));
        } catch (err) {
          console.error(`[ADMS] Failed to update command status for ID ${commandId}:`, err);
        }
      }
    }
  }

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * GET handler for compatibility
 */
export async function GET() {
  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
