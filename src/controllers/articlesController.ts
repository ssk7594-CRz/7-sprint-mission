import { create } from 'superstruct';
import { prismaClient as prisma } from '../lib/prismaClient'; 
import { withAsync } from '../lib/withAsync';
import NotFoundError from '../lib/errors/NotFoundError';
import { IdParamsStruct } from '../structs/commonStructs';
import {
  CreateArticleBodyStruct,
  UpdateArticleBodyStruct,
  GetArticleListParamsStruct,
} from '../structs/articlesStructs';
import { CreateCommentBodyStruct, GetCommentListParamsStruct } from '../structs/commentsStruct';
import type { Request, Response } from 'express';

export const createArticle = withAsync(async (req: Request, res: Response) => {
  const { title, content, image } = create(req.body, CreateArticleBodyStruct);

  const article = await prisma.article.create({ 
    data: {
      title,
      content,
      image,
      userId: req.user.id 
    } 
  });

  res.status(201).send(article);
});


export const getArticle = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new NotFoundError('article', id.toString());

  res.send(article);
});


export const updateArticle = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);
  const { title, content, image } = create(req.body, UpdateArticleBodyStruct);

  const existingArticle = await prisma.article.findUnique({ where: { id } });
  
  if (!existingArticle) throw new NotFoundError('article', id.toString());
  if (existingArticle.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 게시글을 수정할 권한이 없습니다.' });
  }

  const updatedArticle = await prisma.article.update({
    where: { id },
    data: { title, content, image },
  });

  res.send(updatedArticle);
});

export const deleteArticle = withAsync(async (req: Request, res: Response) => {
  const { id } = create(req.params, IdParamsStruct);

  const existingArticle = await prisma.article.findUnique({ where: { id } });
  
  if (!existingArticle) throw new NotFoundError('article', id.toString());
  if (existingArticle.userId !== req.user.id) {
    return res.status(403).json({ message: '해당 게시글을 삭제할 권한이 없습니다.' });
  }

  await prisma.article.delete({ where: { id } });

  res.status(204).send();
});

export const getArticleList = withAsync(async (req: Request, res: Response) => {
  const { page, pageSize, orderBy, keyword } = create(req.query, GetArticleListParamsStruct);

  const where = {
    title: keyword ? { contains: keyword } : undefined,
  };

  const totalCount = await prisma.article.count({ where });
  const articles = await prisma.article.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: orderBy === 'recent' ? { createdAt: 'desc' } : { id: 'asc' },
    where,
  });

  res.send({ list: articles, totalCount });
});


export const createComment = withAsync(async (req: Request, res: Response) => {
  const { id: articleId } = create(req.params, IdParamsStruct);
  const { content } = create(req.body, CreateCommentBodyStruct);

  const existingArticle = await prisma.article.findUnique({ where: { id: articleId } });
  if (!existingArticle) throw new NotFoundError('article', articleId.toString());

  const comment = await prisma.comment.create({
    data: {
      articleId,
      content,
      userId: req.user.id, 
    },
  });

  res.status(201).send(comment);
});


export const getCommentList = withAsync(async (req: Request, res: Response) => {
  const { id: articleId } = create(req.params, IdParamsStruct);
  const { cursor, limit } = create(req.query, GetCommentListParamsStruct);

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError('article', articleId.toString());

  const commentsWithCursor = await prisma.comment.findMany({
    cursor: cursor ? { id: cursor } : undefined,
    take: limit + 1,
    where: { articleId },
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = commentsWithCursor.length > limit;
  const comments = commentsWithCursor.slice(0, limit);
  const nextCursor = hasNextPage ? commentsWithCursor[limit].id : null;

  res.send({ list: comments, nextCursor });
});