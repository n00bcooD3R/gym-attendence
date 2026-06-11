import { NextRequest, NextResponse } from 'next/server';
import { dbGetAttendance } from '@/lib/db-client';

/**
 * GET /api/attendance?date=YYYY-MM-DD
 * Fetches attendance logs, optionally filtered by a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const logs = await dbGetAttendance(date);
    return NextResponse.json(logs, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
