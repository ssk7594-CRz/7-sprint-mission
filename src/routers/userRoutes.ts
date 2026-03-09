import express, { Router } from 'express';
import * as userController from '../controllers/userController'; 
import { authenticate } from '../middlewares/authMiddleware'; 
import { withAsync } from '../lib/withAsync'; 
const router: Router = express.Router();


router.use(authenticate);


router.get('/me', withAsync(userController.getMe));
router.patch('/me', withAsync(userController.updateMe));
router.patch('/me/password', withAsync(userController.changePassword));


router.get('/me/products', withAsync(userController.getMyProducts));
router.get('/me/likes', withAsync(userController.getMyLikedItems));


router.get('/me/notifications', withAsync(userController.getMyNotifications));
router.patch('/me/notifications', withAsync(userController.readAllNotifications));
router.get('/me/notifications/unread-count', withAsync(userController.getUnreadNotificationCount));
router.patch('/me/notifications/:id', withAsync(userController.readNotification));


router.delete('/notifications/cleanup', withAsync(userController.deleteOldNotifications));

export default router;