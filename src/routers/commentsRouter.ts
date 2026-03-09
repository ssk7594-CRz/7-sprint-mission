import express, { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import { updateComment, deleteComment } from '../controllers/commentsController';
import { authenticate } from '../middlewares/authMiddleware';

const commentsRouter: Router = express.Router();

commentsRouter.use(authenticate);
commentsRouter.patch('/:id', withAsync(updateComment));
commentsRouter.delete('/:id', withAsync(deleteComment));

export default commentsRouter;
