import bcrypt from 'bcrypt';
import { create } from 'superstruct';
import { prismaClient as prisma } from '../lib/prismaClient';
import { withAsync } from '../lib/withAsync';
import { UpdateUserStruct, ChangePasswordStruct } from '../structs/userStructs';
import type { Request, Response } from 'express';

export const getMe = withAsync(async (req: Request, res: Response) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

export const updateMe = withAsync(async (req: Request, res: Response) => {
  const { nickname, image } = create(req.body, UpdateUserStruct);

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { nickname, image },
  });

  const { password, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

export const changePassword = withAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = create(req.body, ChangePasswordStruct);

  const isMatch = await bcrypt.compare(currentPassword, req.user.password);
  if (!isMatch) {
    return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedNewPassword },
  });

  res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
});

// ── 내 상품 목록 조회 ────────────────────────────────────────────
export const getMyProducts = withAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: { userId: req.user.id },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where: { userId: req.user.id } }),
  ]);

  res.json({ list: products, totalCount });
});

// ── 내가 좋아요한 상품/게시글 목록 조회 ─────────────────────────
export const getMyLikedItems = withAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const type = req.query.type as string | undefined; // 'product' | 'article'

  if (!type || type === 'product') {
    const [likes, totalCount] = await Promise.all([
      prisma.productLike.findMany({
        where: { userId: req.user.id },
        include: { product: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      prisma.productLike.count({ where: { userId: req.user.id } }),
    ]);

    return res.json({ list: likes.map((l) => l.product), totalCount });
  }

  if (type === 'article') {
    const [likes, totalCount] = await Promise.all([
      prisma.articleLike.findMany({
        where: { userId: req.user.id },
        include: { article: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      prisma.articleLike.count({ where: { userId: req.user.id } }),
    ]);

    return res.json({ list: likes.map((l) => l.article), totalCount });
  }

  res.status(400).json({ message: 'type은 product 또는 article 이어야 합니다.' });
});

// ── 내 알림 목록 조회 ────────────────────────────────────────────
export const getMyNotifications = withAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;

  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.id },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId: req.user.id } }),
  ]);

  res.json({ list: notifications, totalCount });
});

// ── 모든 알림 읽음 처리 ──────────────────────────────────────────
export const readAllNotifications = withAsync(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({ message: '모든 알림을 읽음 처리했습니다.' });
});

// ── 읽지 않은 알림 개수 조회 ─────────────────────────────────────
export const getUnreadNotificationCount = withAsync(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });

  res.json({ count });
});

// ── 단일 알림 읽음 처리 ──────────────────────────────────────────
export const readNotification = withAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await prisma.notification.updateMany({
    where: {
      id: Number(id),
      userId: req.user.id,
    },
    data: { isRead: true },
  });

  if (result.count === 0) {
    return res.status(404).json({ message: '알림을 찾을 수 없거나 권한이 없습니다.' });
  }

  res.status(200).json({ message: '알림을 읽음 처리했습니다.' });
});

// ── 30일 이상 된 알림 삭제 (스케줄러용) ─────────────────────────
export const deleteOldNotifications = withAsync(async (req: Request, res: Response) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  res.status(200).json({ message: `${deleted.count}개의 오래된 알림을 삭제했습니다.` });
});