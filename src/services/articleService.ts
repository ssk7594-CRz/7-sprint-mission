import { articleRepository } from '../repositories/articleRepository';
import NotFoundError from '../lib/errors/NotFoundError';
import ForbiddenError from '../lib/errors/ForbiddenError';

export const articleService = {
  async getArticleDetail(id: number, currentUserId?: number) {
    const article = await articleRepository.findById(id);
    if (!article) throw new NotFoundError('article', id);

    return {
      ...article,
      likes: undefined,
      likeCount: article.likes.length,
      isLiked: currentUserId ? article.likes.some(l => l.userId === currentUserId) : undefined,
    };
  },

  async createArticle(data: any, userId: number) {
    return await articleRepository.create({ ...data, userId });
  },

  async updateArticle(id: number, data: any, userId: number) {
    const article = await articleRepository.findById(id);
    if (!article) throw new NotFoundError('article', id);
    if (article.userId !== userId) throw new ForbiddenError('Should be the owner');

    return await articleRepository.update(id, data);
  },

  async deleteArticle(id: number, userId: number) {
    const article = await articleRepository.findById(id);
    if (!article) throw new NotFoundError('article', id);
    if (article.userId !== userId) throw new ForbiddenError('Should be the owner');

    await articleRepository.delete(id);
  },

  async getArticles(query: any, currentUserId?: number) {
    const articles = await articleRepository.findMany(query);
    return articles.map(article => ({
      ...article,
      likes: undefined,
      likeCount: article.likes.length,
      isLiked: currentUserId 
      ? article.likes.some(l => l.userId === currentUserId)
       : false,
    }));
  },
};