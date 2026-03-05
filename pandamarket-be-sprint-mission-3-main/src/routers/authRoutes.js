import express from 'express';
import { withAsync } from '../lib/withAsync.js';
import * as authController from '../controllers/authController.js';
import { validateSignUp } from '../middlewares/validate.js';

const router = express.Router();

router.post('/signup', validateSignUp, withAsync(authController.signUp));
router.post('/signin', withAsync(authController.signIn));
router.post('/refresh', withAsync(authController.refresh));

export default router;