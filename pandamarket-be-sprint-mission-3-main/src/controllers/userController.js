import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { create } from 'superstruct';
import { UpdateUserStruct, ChangePasswordStruct } from '../structs/userStructs.js';

const prisma = new PrismaClient();


export const getMe = async (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
};


export const updateMe = async (req, res) => {
  try {
    const { nickname, image } = create(req.body, UpdateUserStruct);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { nickname, image },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ message: '수정 데이터 형식이 올바르지 않습니다.' });
  }
};

export const changePassword = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyProducts = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
};

export const getMyLikedProducts = async (req, res) => {
  const userId = req.user.id;

  const likedEntries = await prisma.productLike.findMany({
    where: { userId },
    include: {
      product: true,
    },
  });

  const products = likedEntries.map((entry) => ({
    ...entry.product,
    isLiked: true,
  }));

  res.json(products);
};

export const getMyNotifications = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(notifications);
};

export const readNotification = async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.updateMany({
    where: {
      id: Number(id),
      userId: req.user.id,
    },
    data: { isRead: true },
  });

  if (notification.count === 0) {
    return res.status(404).json({ message: '알림을 찾을 수 없거나 권한이 없습니다.' });
  }

  res.status(200).json({ message: '알림을 읽음 처리했습니다.' });
};

export const readAllNotifications = async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  res.status(200).json({ message: '모든 알림을 읽음 처리했습니다.' });
};

export const getUnreadNotificationCount = async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user.id,
      isRead: false,
    },
  });

  res.json({ count });
};

export const deleteOldNotifications = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  });
  
  return deleted.count;
};
