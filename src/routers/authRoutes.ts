import express, { Router } from 'express';
import { withAsync } from '../lib/withAsync'; 
import * as authController from '../controllers/authController'; 
import { validateSignUp } from '../middlewares/validate'; 

const router: Router = express.Router();

router.post('/signup', validateSignUp, withAsync(authController.signUp));
router.post('/signin', withAsync(authController.signIn));
router.post('/refresh', withAsync(authController.refresh));

export default router;