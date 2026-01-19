import { prismaClient } from '../lib/prismaClient';

export const commentRepository = {
  async create(data: { articleId: number; content: string; userId: number }) {
    return await prismaClient.comment.create({ data });
  },

  async findManyByArticleId(params: { articleId: number; cursor?: number; limit: number }) {
    const { articleId, cursor, limit } = params;
    return await prismaClient.comment.findMany({
      where: { articleId },
      cursor: cursor ? { id: cursor } : undefined,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });
  }
};