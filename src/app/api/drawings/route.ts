import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getUserFromRequest(req); // ✅ pass req to getUserFromRequest

    const drawings = await prisma.drawing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(drawings);
  } catch (err) {
    console.error('[DRAWINGS] Auth error:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
