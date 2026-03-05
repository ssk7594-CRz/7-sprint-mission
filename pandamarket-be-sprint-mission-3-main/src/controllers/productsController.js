import { create } from 'superstruct';
import { prismaClient } from '../lib/prismaClient.js';
import NotFoundError from '../lib/errors/NotFoundError.js';
import { IdParamsStruct } from '../structs/commonStructs.js';
import {
  CreateProductBodyStruct,
  GetProductListParamsStruct,
  UpdateProductBodyStruct,
} from '../structs/productsStruct.js';
import { emitNotification } from '../socket/socket.js';


export async function createProduct(req, res) {
  try {
    const { name, description, price, tags, images } = create(req.body, CreateProductBodyStruct);

    const product = await prismaClient.product.create({
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
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getProduct(req, res) {
  const { id } = create(req.params, IdParamsStruct);

  const product = await prismaClient.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundError('product', id);
  }

  return res.send(product);
}


export async function updateProduct(req, res) {
  const { id } = create(req.params, IdParamsStruct);
  const { name, description, price, tags, images } = create(req.body, UpdateProductBodyStruct);

  const existingProduct = await prismaClient.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new NotFoundError('product', id);
  }

  if (existingProduct.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 상품을 수정할 권한이 없습니다.' });
  }

  const isPriceChanged = price !== undefined && existingProduct.price !== price;

  const updatedProduct = await prismaClient.product.update({
    where: { id },
    data: { name, description, price, tags, images },
  });

  if (isPriceChanged) {
    const likes = await prismaClient.productLike.findMany({
      where: { productId: id },
      select: { userId: true },
    });

    if (likes.length > 0) {
      const message = `관심 상품 [${updatedProduct.name}]의 가격이 ${existingProduct.price}원에서 ${price}원으로 변경되었습니다!`;

      await prismaClient.notification.createMany({
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

  return res.send(updatedProduct);
}

export async function deleteProduct(req, res) {
  const { id } = create(req.params, IdParamsStruct);
  const existingProduct = await prismaClient.product.findUnique({ where: { id } });

  if (!existingProduct) {
    throw new NotFoundError('product', id);
  }

  if (existingProduct.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 상품을 삭제할 권한이 없습니다.' });
  }

  await prismaClient.product.delete({ where: { id } });

  return res.status(204).send();
}

export async function getProductList(req, res) {
  const { page, pageSize, orderBy, keyword } = create(req.query, GetProductListParamsStruct);

  const where = keyword
    ? {
        OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
      }
    : undefined;
  const totalCount = await prismaClient.product.count({ where });
  const products = await prismaClient.product.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
    where,
  });

  return res.send({
    list: products,
    totalCount,
  });
}

