import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { withAsync } from '../lib/withAsync';

const prisma = new PrismaClient();


const generateTokens = (user: User) => {
  const accessSecret = process.env.JWT_SECRET || 'access_secret';
  const refreshSecret = process.env.REFRESH_SECRET || 'refresh_secret';

  const accessToken = jwt.sign({ id: user.id }, accessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};


export const signUp = withAsync(async (req: Request, res: Response) => {
  const { email, nickname, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, nickname, password: hashedPassword },
  });

  const { password: _, refreshToken: __, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});


export const signIn = withAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
  }

  const { accessToken, refreshToken } = generateTokens(user);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  const { password: _, refreshToken: __, ...userWithoutPassword } = user;
  res.status(200).json({
    accessToken,
    refreshToken, 
    user: userWithoutPassword,
  });
});


export const refresh = withAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
  }

  const refreshSecret = process.env.REFRESH_SECRET || 'refresh_secret';

  const decoded = jwt.verify(refreshToken, refreshSecret) as { id: number };
  
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  
  if (!user || user.refreshToken !== refreshToken) {
    return res.status(403).json({ message: '유효하지 않은 리프레시 토큰입니다.' });
  }

  const tokens = generateTokens(user);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});