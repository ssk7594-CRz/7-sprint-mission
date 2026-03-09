import { create } from 'superstruct';
import { prismaClient as prisma } from '../lib/prismaClient'; // 통일된 이름 사용
import { withAsync } from '../lib/withAsync';
import { UpdateCommentBodyStruct, CreateCommentBodyStruct, GetCommentListParamsStruct } from '../structs/commentsStruct';
import NotFoundError from '../lib/errors/NotFoundError';
import { IdParamsStruct } from '../structs/commonStructs';
import type { Request, Response } from 'express';


export const createComment = withAsync(async (req: Request, res: Response) => {
  const { id: productId } = create(req.params, IdParamsStruct);
  const { content } = create(req.body, CreateCommentBodyStruct);

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
  if (!existingProduct) {
    throw new NotFoundError('product', productId.toString());
  }

  const comment = await prisma.comment.create({ 
    data: { 
      productId, 
      content,
      userId: req.user.id 
    } 
  });

  if (existingProduct.userId && existingProduct.userId !== req.user.id) {
    await prisma.notification.create({
      data: {
        type: 'COMMENT',
        userId: existingProduct.userId,
        message: `[${existingProduct.name}] 상품에 새로운 댓글이 달렸습니다: ${content.substring(0, 15)}...`,
        productId: productId,
      },
    });
  }

  res.status(201).send(comment);
});


export const getCommentList = withAsync(async (req: Request, res: Response) => {
  const { id: productId } = create(req.params, IdParamsStruct);
  const { cursor, limit } = create(req.query, GetCommentListParamsStruct);

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
  if (!existingProduct) {
    throw new NotFoundError('product', productId.toString());
  }

  const commentsWithCursor = await prisma.comment.findMany({
    cursor: cursor ? { id: cursor } : undefined,
    take: limit + 1,
    where: { productId },
    orderBy: { createdAt: 'desc' }, 
  });

  const hasNextPage = commentsWithCursor.length > limit;
  const comments = commentsWithCursor.slice(0, limit);
  const nextCursor = hasNextPage ? commentsWithCursor[limit].id : null;

  res.send({
    list: comments,
    nextCursor,
  });
});

export const updateComment = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);
  const { content } = create(req.body, UpdateCommentBodyStruct);

  const existingComment = await prisma.comment.findUnique({ where: { id } });
  if (!existingComment) {
    throw new NotFoundError('comment', id.toString());
  }

  if (existingComment.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 댓글을 수정할 권한이 없습니다.' });
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: { content },
  });

  res.send(updatedComment);
});


export const deleteComment = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);

  const existingComment = await prisma.comment.findUnique({ where: { id } });
  if (!existingComment) {
    throw new NotFoundError('comment', id.toString());
  }

  if (existingComment.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 댓글을 삭제할 권한이 없습니다.' });
  }

  await prisma.comment.delete({ where: { id } });

  res.status(204).send();
});