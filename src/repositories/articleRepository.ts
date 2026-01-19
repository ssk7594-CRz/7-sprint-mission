import { prismaClient } from '../lib/prismaClient';

export const articleRepository = {
  async findById(id: number) {
    return await prismaClient.article.findUnique({
      where: { id },
      include: { likes: true }
    });
  },

  async create(data: any) {
    return await prismaClient.article.create({ data });
  },

  async update(id: number, data: any) {
    return await prismaClient.article.update({ where: { id }, data });
  },

  async delete(id: number) {
    return await prismaClient.article.delete({ where: { id } });
  },

  async findMany(params: { skip: number; take: number; orderBy: any; where: any }) {
    return await prismaClient.article.findMany({
      ...params,
      include: { likes: true },
    });
  },

  async count(where: any) {
    return await prismaClient.article.count({ where });
  }
};