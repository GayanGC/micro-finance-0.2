import express from 'express';
import {
  createHoliday,
  getHolidays,
  deleteHoliday,
} from '../controllers/holidayController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireSubscriptionTier } from '../middleware/tenantGatingMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireSubscriptionTier('Standard'));

router.post('/', authorize('Admin', 'super_admin', 'SUPER_ADMIN'), createHoliday);
router.get('/', getHolidays);
router.delete('/:id', authorize('Admin', 'super_admin', 'SUPER_ADMIN'), deleteHoliday);

export default router;
