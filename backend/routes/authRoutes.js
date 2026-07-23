import express from 'express';
import {
  loginUser,
  registerUser,
  getMe,
  seedUsers,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/seed', seedUsers);
router.get('/me', protect, getMe);

export default router;
