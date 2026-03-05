import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const toggleProductLike = async (req, res) => {
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
    return res.json({ isLiked: false });
  } else {
    await prisma.productLike.create({
      data: {
        userId: userId,
        productId: Number(productId),
      },
    });
    return res.json({ isLiked: true });
  }
};

export const toggleArticleLike = async (req, res) => {
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
    return res.json({ isLiked: false });
  } else {
    await prisma.articleLike.create({
      data: { userId, articleId: Number(articleId) },
    });
    return res.json({ isLiked: true });
  }
};

export const getProductDetail = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id; 

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      _count: { select: { productLikes: true } } 
    }
  });

  if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

  let isLiked = false;
  if (userId) {
    const like = await prisma.productLike.findUnique({
      where: { userId_productId: { userId, productId: Number(id) } }
    });
    isLiked = !!like;
  }

  res.json({ ...product, isLiked });
};