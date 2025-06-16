import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[LOGIN] Method:', req.method);
  console.log('[LOGIN] Headers:', req.headers);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email, password } = req.body;
    console.log('[LOGIN] Body:', req.body);

    if (!email || !password) {
      console.warn('[LOGIN] Missing email or password');
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('[LOGIN] User fetched:', user?.id);

    if (!user) {
      console.warn('[LOGIN] No user found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[LOGIN] Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    res.setHeader('Set-Cookie', cookie);
    console.log('[LOGIN] Login successful, token set');
    return res.status(200).json({ message: 'Login successful' });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[LOGIN] Error:', error.message);
      console.error(error.stack);
    } else {
      console.error('[LOGIN] Unknown error:', error);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
