import express from 'express';
import {
  registerCustomer,
  getCustomers,
  updateCustomer,
  recalculateCreditScore,
  getCustomerTimeline,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

const staffRoles = ['Admin', 'Agent', 'super_admin', 'credit_officer'];

router.post('/', protect, authorize(...staffRoles), auditLog('CREATE', 'Customer'), registerCustomer);
router.get('/', protect, authorize(...staffRoles), getCustomers);
router.put('/:id', protect, authorize('Admin', 'super_admin', 'credit_officer'), auditLog('UPDATE', 'Customer'), updateCustomer);
router.post('/:id/score', protect, authorize('Admin', 'super_admin', 'credit_officer'), recalculateCreditScore);

// ── Timeline (must come before /:id to avoid conflict) ──
router.get('/:id/timeline', protect, authorize(...staffRoles), getCustomerTimeline);

export default router;
