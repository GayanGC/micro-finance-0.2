import express from 'express';
import {
  addRepayment,
  getRepayments,
  onlinePayment,
} from '../controllers/repaymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.post('/add', protect, authorize('Admin', 'Agent', 'super_admin'), auditLog('PAYMENT', 'Repayment'), addRepayment);
router.post('/online', protect, auditLog('PAYMENT', 'Repayment'), onlinePayment);
router.get('/', protect, getRepayments);

export default router;
