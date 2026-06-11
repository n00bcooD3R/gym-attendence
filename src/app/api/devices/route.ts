import { NextRequest, NextResponse } from 'next/server';
import { dbGetDevices, dbGetCommands, dbQueueCommand } from '@/lib/db-client';

/**
 * GET /api/devices
 * Fetches all registered devices and recent command history
 */
export async function GET() {
  try {
    const devices = await dbGetDevices();
    const commands = await dbGetCommands();
    return NextResponse.json({ devices, commands }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/devices
 * Queues a new command for a device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, command, commandType, title } = body;

    if (!deviceId || !command || !commandType || !title) {
      return NextResponse.json({ error: 'deviceId, command, commandType, and title are required' }, { status: 400 });
    }

    const queuedCommand = await dbQueueCommand(deviceId, command.toUpperCase(), commandType, title);
    return NextResponse.json(queuedCommand, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
