import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getUserFromRequest(req) as { userId: string };
    const { id, name, dataUrl } = req.body;

    if (!name || !dataUrl) {
      return res.status(400).json({ error: 'Missing name or image data' });
    }

    if (id) {
      const existing = await prisma.drawing.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ error: 'Drawing not found' });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await prisma.drawing.update({
        where: { id },
        data: { name, dataUrl },
      });

      return res.status(200).json(updated);
    }

    const newDrawing = await prisma.drawing.create({
      data: { userId, name, dataUrl },
    });

    return res.status(201).json(newDrawing);
  } catch {
    return res.status(401).json({ error: 'Unauthorized or session expired' });
  }
}
