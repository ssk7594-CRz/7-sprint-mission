import express from 'express';
import { withAsync } from '../lib/withAsync.js';
import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductList,
  createComment,
  getCommentList,
} from '../controllers/productsController.js';
import { toggleProductLike } from '../controllers/likeController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const productsRouter = express.Router();

 productsRouter.post('/', authenticate, withAsync(createProduct));
 productsRouter.get('/:id', authenticate, withAsync(getProduct));
 productsRouter.patch('/:id', authenticate, withAsync(updateProduct));
 productsRouter.delete('/:id', authenticate, withAsync(deleteProduct));
 productsRouter.get('/', authenticate, withAsync(getProductList));
 productsRouter.post('/:id/comments', authenticate, withAsync(createComment));
 productsRouter.get('/:id/comments', authenticate, withAsync(getCommentList));
 productsRouter.post('/:id/like', authenticate, withAsync(toggleProductLike));

export default productsRouter;
