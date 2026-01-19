import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';
import { generateTokens, verifyRefreshToken } from '../lib/token';
import BadRequestError from '../lib/errors/BadRequestError';

export const authService = {
  async register(data: any) {
    const { email, nickname, password } = data;

    const isExist = await userRepository.findByEmail(email);
    if (isExist) throw new BadRequestError('User already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userRepository.createUser({
      email,
      nickname,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async login(data: any) {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email);
    if (!user) throw new BadRequestError('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new BadRequestError('Invalid credentials');

    return generateTokens(user.id);
  },

  async refresh(token: string) {
    const { userId } = verifyRefreshToken(token);

    const user = await userRepository.findById(userId);
    if (!user) throw new BadRequestError('Invalid refresh token');

    return generateTokens(userId);
  }
};