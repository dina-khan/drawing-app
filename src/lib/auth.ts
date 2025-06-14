import { verify } from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET!;
type JwtPayload = { userId: string };

export function getUserFromRequest(req: NextApiRequest): JwtPayload {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) throw new Error('Unauthorized');

  try {
    return verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new Error('Unauthorized');
  }
}

