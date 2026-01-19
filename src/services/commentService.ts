import { commentRepository } from '../repositories/commentRepository';
import { articleRepository } from '../repositories/articleRepository';
import NotFoundError from '../lib/errors/NotFoundError';

export const commentService = {
  async createComment(articleId: number, content: string, userId: number) {
    
    const article = await articleRepository.findById(articleId);
    if (!article) throw new NotFoundError('article', articleId);

    return await commentRepository.create({ articleId, content, userId });
  },

  async getCommentList(articleId: number, limit: number, cursor?: number) {
    const article = await articleRepository.findById(articleId);
    if (!article) throw new NotFoundError('article', articleId);

    const commentsWithCursor = await commentRepository.findManyByArticleId({
      articleId,
      cursor,
      limit,
    });

    const comments = commentsWithCursor.slice(0, limit);
    const cursorComment = commentsWithCursor[commentsWithCursor.length - 1];
    const nextCursor = (commentsWithCursor.length > limit && cursorComment) 
      ? cursorComment.id 
      : null;

    return { list: comments, nextCursor };
  }
};