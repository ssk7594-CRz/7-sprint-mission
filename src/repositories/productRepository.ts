import { prismaClient } from '../lib/prismaClient';

export const productRepository = {
  async findById(id: number) {
    return await prismaClient.product.findUnique({
      where: { id },
      include: { favorites: true },
    });
  },

  async create(data: any) {
    return await prismaClient.product.create({ data });
  },

  async update(id: number, data: any) {
    return await prismaClient.product.update({ where: { id }, data });
  },

  async delete(id: number) {
    return await prismaClient.product.delete({ where: { id } });
  },

  async findMany(params: { skip: number; take: number; orderBy: any; where: any }) {
    return await prismaClient.product.findMany({
      ...params,
      include: { favorites: true },
    });
  },

  async count(where: any) {
    return await prismaClient.product.count({ where });
  },

  async findFavorite(productId: number, userId: number) {
    return await prismaClient.favorite.findFirst({
      where: { productId, userId },
    });
  },

  async createFavorite(productId: number, userId: number) {
    return await prismaClient.favorite.create({ data: { productId, userId } });
  },

  async deleteFavorite(id: number) {
    return await prismaClient.favorite.delete({ where: { id } });
  }
};