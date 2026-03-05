import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { withAsync } from '../lib/withAsync.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', authenticate, withAsync(userController.getMe));
router.patch('/me', authenticate, withAsync(userController.updateMe));
router.patch('/me/password', authenticate, withAsync(userController.changePassword));
router.get('/me/products', authenticate, withAsync(userController.getMyProducts));
router.get('/me/likes', authenticate, withAsync(userController.getMyLikedItems));
router.get('/me/notifications', authenticate, withAsync(userController.getMyNotifications));
router.patch('/me/notifications', authenticate, withAsync(userController.readAllNotifications));
router.get('/me/notifications/unread-count', authenticate, withAsync(userController.getUnreadNotificationCount));
router.delete('/notifications/cleanup', withAsync(userController.deleteOldNotifications));
router.patch('/me/notifications/:id', authenticate, withAsync(userController.readNotification));

export default router;