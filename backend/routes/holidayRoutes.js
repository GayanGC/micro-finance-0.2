import express from 'express';
import {
  createHoliday,
  getHolidays,
  deleteHoliday,
} from '../controllers/holidayController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'super_admin'), createHoliday);
router.get('/', protect, getHolidays);
router.delete('/:id', protect, authorize('Admin', 'super_admin'), deleteHoliday);

export default router;
