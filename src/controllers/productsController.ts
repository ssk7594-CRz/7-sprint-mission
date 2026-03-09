import { create } from 'superstruct';
import { prismaClient as prisma } from '../lib/prismaClient'; 
import { withAsync } from '../lib/withAsync';
import NotFoundError from '../lib/errors/NotFoundError';
import { IdParamsStruct } from '../structs/commonStructs';
import {
  CreateProductBodyStruct,
  GetProductListParamsStruct,
  UpdateProductBodyStruct,
} from '../structs/productsStruct'; 
import { emitNotification } from '../socket/socket'; 
import type { Request, Response } from 'express';


export const createProduct = withAsync(async (req: Request, res: Response) => {
  const { name, description, price, tags, images } = create(req.body, CreateProductBodyStruct);

  const product = await prisma.product.create({
    data: { 
      name, 
      description, 
      price, 
      tags, 
      images,
      userId: req.user.id 
    },
  });

  res.status(201).send(product);
});


export const getProduct = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('product', id.toString());

  res.send(product);
});


export const updateProduct = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);
  const { name, description, price, tags, images } = create(req.body, UpdateProductBodyStruct);

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new NotFoundError('product', id.toString());

  if (existingProduct.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 상품을 수정할 권한이 없습니다.' });
  }

  const isPriceChanged = price !== undefined && existingProduct.price !== price;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { name, description, price, tags, images },
  });

  if (isPriceChanged) {
    const likes = await prisma.productLike.findMany({
      where: { productId: id },
      select: { userId: true },
    });

    if (likes.length > 0) {
      const message = `관심 상품 [${updatedProduct.name}]의 가격이 ${existingProduct.price}원에서 ${price}원으로 변경되었습니다!`;

      await prisma.notification.createMany({
        data: likes.map((like) => ({
          type: 'PRICE_CHANGE',
          userId: like.userId,
          message: message,
          productId: id,
        })),
      });

      const io = req.app.get('io');
      likes.forEach((like) => {
        emitNotification(io, like.userId, {
          type: 'PRICE_CHANGE',
          message: message,
          productId: id,
          createdAt: new Date(),
        });
      });
    }
  }

  res.send(updatedProduct);
});


export const getProductList = withAsync(async (req: Request, res: Response) => {
  const { page, pageSize, orderBy, keyword } = create(req.query, GetProductListParamsStruct);

  const where = keyword
    ? {
        OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
      }
    : undefined;

  const totalCount = await prisma.product.count({ where });
  const products = await prisma.product.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
    where,
  });

  res.send({ list: products, totalCount });
});

export const deleteProduct = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new NotFoundError('product', id.toString());

  if (existingProduct.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 상품을 삭제할 권한이 없습니다.' });
  }

  await prisma.product.delete({ where: { id } });

  res.status(204).send();
});
