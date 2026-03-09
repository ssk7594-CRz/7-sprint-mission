import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import { withAsync } from '../lib/withAsync';

const prisma = new PrismaClient();


export const toggleProductLike = withAsync(async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const userId = req.user.id; 

  const existingLike = await prisma.productLike.findUnique({
    where: {
      userId_productId: {
        userId: userId,
        productId: Number(productId),
      },
    },
  });

  if (existingLike) {
    await prisma.productLike.delete({
      where: { id: existingLike.id },
    });
    res.json({ isLiked: false });
  } else {
    // 좋아요 생성
    await prisma.productLike.create({
      data: {
        userId: userId,
        productId: Number(productId),
      },
    });
    res.json({ isLiked: true });
  }
});

/**
 * 💡 게시글 좋아요 토글
 */
export const toggleArticleLike = withAsync(async (req: Request, res: Response) => {
  const { id: articleId } = req.params;
  const userId = req.user.id;

  const existingLike = await prisma.articleLike.findUnique({
    where: {
      userId_articleId: {
        userId: userId,
        articleId: Number(articleId),
      },
    },
  });

  if (existingLike) {
    await prisma.articleLike.delete({ where: { id: existingLike.id } });
    res.json({ isLiked: false });
  } else {
    await prisma.articleLike.create({
      data: { 
        userId, 
        articleId: Number(articleId) 
      },
    });
    res.json({ isLiked: true });
  }
});


export const getProductDetail = withAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id; 

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      _count: { select: { productLikes: true } } 
    }
  });

  if (!product) {
    return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
  }

  let isLiked = false;
  if (userId) {
    const like = await prisma.productLike.findUnique({
      where: { 
        userId_productId: { 
          userId, 
          productId: Number(id) 
        } 
      }
    });
    isLiked = !!like;
  }

  res.json({ ...product, isLiked });
});