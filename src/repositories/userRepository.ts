import { prismaClient } from '../lib/prismaClient';

export const userRepository = {
  async findByEmail(email: string) {
    return await prismaClient.user.findUnique({ where: { email } });
  },

  async findById(id: number) {
    return await prismaClient.user.findUnique({ where: { id } });
  },

  async createUser(data: any) {
    return await prismaClient.user.create({ data });
  },

  async update(id: number, data: any) {
    return await prismaClient.user.update({ where: { id }, data });
  }
};