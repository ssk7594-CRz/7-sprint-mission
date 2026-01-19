import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';
import { productRepository } from '../repositories/productRepository';
import NotFoundError from '../lib/errors/NotFoundError';
import UnauthorizedError from '../lib/errors/UnauthorizedError';

export const userService = {
  async getMyInfo(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('user', userId);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateMyInfo(userId: number, data: any) {
    const updatedUser = await userRepository.update(userId, data);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },

  async updatePassword(userId: number, passwordData: any) {
    const { password, newPassword } = passwordData;
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('user', userId);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError('Invalid credentials');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.update(userId, { password: hashedPassword });
  },

  async getMyProducts(userId: number, params: any) {
    const { page, pageSize, orderBy, keyword } = params;
    const where = {
      userId,
      ...(keyword ? { OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }] } : {}),
    };

    const totalCount = await productRepository.count(where);
    const products = await productRepository.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
      where,
    });

    const list = products.map((product) => ({
      ...product,
      favorites: undefined,
      favoriteCount: product.favorites.length,
      isFavorited: product.favorites.some((f) => f.userId === userId),
    }));

    return { list, totalCount };
  },

  async getMyFavorites(userId: number, params: any) {
    const { page, pageSize, orderBy, keyword } = params;
    const where = {
      favorites: { some: { userId } },
      ...(keyword ? { OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }] } : {}),
    };

    const totalCount = await productRepository.count(where);
    const products = await productRepository.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
      where,
    });

    const list = products.map((product) => ({
      ...product,
      favorites: undefined,
      favoriteCount: product.favorites.length,
      isFavorited: true, 
    }));

    return { list, totalCount };
  }
};