import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getUserFromRequest(req);

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop(); // Extract ID from URL

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid drawing ID' }, { status: 400 });
    }

    const drawing = await prisma.drawing.findUnique({
      where: { id },
    });

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    if (drawing.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(drawing, { status: 200 });
  } catch (error) {
    console.error('[DRAWING ID] Error:', error);
    return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
  }
}
