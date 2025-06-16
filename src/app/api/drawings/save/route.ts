import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getUserFromRequest(req); 
    const body = await req.json();
    const { id, name, dataUrl } = body;

    if (!name || !dataUrl) {
      return NextResponse.json({ error: 'Missing name or image data' }, { status: 400 });
    }

    if (id) {
      const existing = await prisma.drawing.findUnique({ where: { id } });

      if (!existing) {
        return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
      }

      if (existing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await prisma.drawing.update({
        where: { id },
        data: { name, dataUrl },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    const newDrawing = await prisma.drawing.create({
      data: { userId, name, dataUrl },
    });

    return NextResponse.json(newDrawing, { status: 201 });
  } catch (error) {
    console.error('[SAVE] Error:', error);
    return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
  }
}
