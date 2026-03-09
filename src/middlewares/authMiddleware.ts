import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();


interface JwtPayload {
  id: number;
}


export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '로그인이 필요한 서비스입니다.' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as unknown as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
    }

    req.user = user; 
    next();
  } catch (error) {
    return res.status(401).json({ message: '인증에 실패했습니다. 다시 로그인해 주세요.' });
  }
};