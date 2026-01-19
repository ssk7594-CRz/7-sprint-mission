import { productRepository } from '../repositories/productRepository';
import NotFoundError from '../lib/errors/NotFoundError';
import ForbiddenError from '../lib/errors/ForbiddenError';
import BadRequestError from '../lib/errors/BadRequestError';

export const productService = {
  async getProductDetail(id: number, currentUserId?: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('product', id);

    return {
      ...product,
      favorites: undefined,
      favoriteCount: product.favorites.length,
      isFavorited: currentUserId ? product.favorites.some(f => f.userId === currentUserId) : undefined,
    };
  },

  async getProductList(params: { page: number; pageSize: number; orderBy?: string | undefined; keyword?: string | undefined }, currentUserId?: number) {
    const { page, pageSize, orderBy, keyword } = params;
    const where = keyword ? {
      OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
    } : undefined;

    const totalCount = await productRepository.count(where);
    const products = await productRepository.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
      where,
    });

    const list = products.map(product => ({
      ...product,
      favorites: undefined,
      favoriteCount: product.favorites.length,
      isFavorited: currentUserId ? product.favorites.some(f => f.userId === currentUserId) : undefined,
    }));

    return { list, totalCount };
  },

  async createProduct(data: any, userId: number) {
    return await productRepository.create({ ...data, userId });
  },

  async updateProduct(id: number, data: any, userId: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('product', id);
    if (product.userId !== userId) throw new ForbiddenError('Should be the owner');

    return await productRepository.update(id, data);
  },

  async deleteProduct(id: number, userId: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('product', id);
    if (product.userId !== userId) throw new ForbiddenError('Should be the owner');

    await productRepository.delete(id);
  },

  async toggleFavorite(productId: number, userId: number, isAdding: boolean) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('product', productId);

    const existingFavorite = await productRepository.findFavorite(productId, userId);

    if (isAdding) {
      if (existingFavorite) throw new BadRequestError('Already favorited');
      await productRepository.createFavorite(productId, userId);
    } else {
      if (!existingFavorite) throw new BadRequestError('Not favorited');
      await productRepository.deleteFavorite(existingFavorite.id);
    }
  }
};