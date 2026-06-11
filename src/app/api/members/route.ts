import { NextRequest, NextResponse } from 'next/server';
import { dbGetMembers, dbAddMember, dbUpdateMember, dbDeleteMember } from '@/lib/db-client';

/**
 * GET /api/members
 * Fetches all members
 */
export async function GET() {
  try {
    const members = await dbGetMembers();
    return NextResponse.json(members, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/members
 * Adds a new member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validations
    if (!body.name || !body.admission_no || !body.next_due_date) {
      return NextResponse.json({ error: 'Name, admission_no, and next_due_date are required' }, { status: 400 });
    }

    const newMember = await dbAddMember({
      name: body.name,
      admission_no: body.admission_no.trim(),
      phone: body.phone || '',
      photo_url: body.photo_url || '',
      address: body.address || '',
      dob: body.dob || '',
      age: body.age ? parseInt(body.age) : undefined,
      gender: body.gender || '',
      weight: body.weight ? parseFloat(body.weight) : undefined,
      height: body.height ? parseFloat(body.height) : undefined,
      join_date: body.join_date || new Date().toISOString().split('T')[0],
      fee_amount: body.fee_amount ? parseFloat(body.fee_amount) : 0,
      fee_cycle_days: body.fee_cycle_days ? parseInt(body.fee_cycle_days) : 30,
      next_due_date: body.next_due_date,
      last_payment_date: body.last_payment_date || null,
      is_pt_client: !!body.is_pt_client,
      active: body.active !== false,
      notes: body.notes || '',
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/members
 * Updates an existing member
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const updated = await dbUpdateMember(id, updates);
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/members
 * Deletes a member
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const success = await dbDeleteMember(id);
    return NextResponse.json({ success }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
