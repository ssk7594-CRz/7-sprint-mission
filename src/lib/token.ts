import jwt from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from './constants';

interface AuthTokenPayload {
  id: number;
}

export function generateTokens(userId : number) {
  const accessToken = jwt.sign({ id: userId }, JWT_ACCESS_TOKEN_SECRET as string , {
    expiresIn: '1h',
  });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_TOKEN_SECRET as string, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET as string) as AuthTokenPayload;
  return { userId: decoded.id };
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, JWT_REFRESH_TOKEN_SECRET as string) as AuthTokenPayload;
  return { userId: decoded.id };
}
