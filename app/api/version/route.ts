import { NextResponse } from 'next/server';
import { VERSION, CHANGELOG } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ version: VERSION, changelog: CHANGELOG });
}
