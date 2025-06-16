import { verify } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
type JwtPayload = { userId: string };

export function getUserFromRequest(req: NextRequest): JwtPayload {
  const token = req.cookies.get('token')?.value;

  if (!token) throw new Error('Unauthorized');

  try {
    return verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new Error('Unauthorized');
  }
}
