import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
type JwtPayload = { userId: string };

export async function getUserFromRequest(): Promise<JwtPayload> {
  const cookieStore = await cookies(); // await is required
  const token = cookieStore.get('token')?.value;

  if (!token) throw new Error('Unauthorized');

  try {
    return verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new Error('Unauthorized');
  }
}

