import express from 'express';
import { withAsync } from '../lib/withAsync.js';
import {
  createArticle,
  getArticleList,
  getArticle,
  updateArticle,
  deleteArticle,
  createComment,
  getCommentList,
} from '../controllers/articlesController.js';
import { toggleArticleLike } from '../controllers/likeController.js'; 
import { authenticate } from '../middlewares/authMiddleware.js';

const articlesRouter = express.Router();

articlesRouter.post('/', authenticate, withAsync(createArticle));
articlesRouter.get('/', authenticate, withAsync(getArticleList));
articlesRouter.get('/:id', authenticate, withAsync(getArticle));
articlesRouter.patch('/:id', authenticate, withAsync(updateArticle));
articlesRouter.delete('/:id', authenticate, withAsync(deleteArticle));
articlesRouter.post('/:id/comments', authenticate, withAsync(createComment));
articlesRouter.get('/:id/comments', authenticate, withAsync(getCommentList));
articlesRouter.post('/:id/like', authenticate, withAsync(toggleArticleLike)); 

export default articlesRouter;
