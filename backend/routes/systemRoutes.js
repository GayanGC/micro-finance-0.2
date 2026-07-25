import express from 'express';
import { getSystemMode, setSystemMode, getSystemHealth } from '../controllers/systemController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/health', getSystemHealth); // Public endpoint
router.get('/mode', protect, getSystemMode);
router.put('/mode', protect, authorize('Admin', 'super_admin'), setSystemMode);

export default router;
