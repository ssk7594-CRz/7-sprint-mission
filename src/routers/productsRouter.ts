import express, { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductList,
} from '../controllers/productsController'; 
import { createComment, getCommentList } from '../controllers/commentsController';
import { toggleProductLike } from '../controllers/likeController'; 
import { authenticate } from '../middlewares/authMiddleware'; 

const productsRouter: Router = express.Router();

productsRouter.get('/', withAsync(getProductList));
productsRouter.get('/:id', withAsync(getProduct));


productsRouter.use(authenticate);

// 상품(Product) 관련
productsRouter.post('/', withAsync(createProduct));
productsRouter.patch('/:id', withAsync(updateProduct));
productsRouter.delete('/:id', withAsync(deleteProduct));

// 댓글(Comment) 관련
productsRouter.post('/:id/comments', withAsync(createComment));
productsRouter.get('/:id/comments', withAsync(getCommentList));

// 좋아요(Like) 관련
productsRouter.post('/:id/like', withAsync(toggleProductLike));

export default productsRouter;