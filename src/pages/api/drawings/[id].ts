import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = getUserFromRequest(req) as { userId: string };

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid drawing ID' });
    }

    const drawing = await prisma.drawing.findUnique({
      where: { id },
    });

    if (!drawing) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    if (drawing.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(drawing);
  } catch {
    return res.status(401).json({ error: 'Unauthorized or session expired' });
  }
}
