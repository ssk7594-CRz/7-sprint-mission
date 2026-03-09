import express, { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import {
  createArticle,
  getArticleList,
  getArticle,
  updateArticle,
  deleteArticle,
  createComment,
  getCommentList,
} from '../controllers/articlesController';
import { toggleArticleLike } from '../controllers/likeController'; 
import { authenticate } from '../middlewares/authMiddleware';

const articlesRouter: Router = express.Router();

articlesRouter.get('/', withAsync(getArticleList));
articlesRouter.get('/:id', withAsync(getArticle));

articlesRouter.use(authenticate);

articlesRouter.post('/', withAsync(createArticle));
articlesRouter.patch('/:id', withAsync(updateArticle));
articlesRouter.delete('/:id', withAsync(deleteArticle));
articlesRouter.post('/:id/comments', withAsync(createComment));
articlesRouter.get('/:id/comments', withAsync(getCommentList));
articlesRouter.post('/:id/like', withAsync(toggleArticleLike));

export default articlesRouter;