import express from 'express';
import {
  calculateLoan,
  createLoan,
  getLoans,
  getLoanById,
  getAmortizationSchedule,
  approveLoan,
  updatePARBuckets,
} from '../controllers/loanController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

const staffRoles = ['Admin', 'Agent', 'super_admin', 'credit_officer'];

router.post('/calculate', protect, calculateLoan);
router.post('/', protect, authorize(...staffRoles), auditLog('CREATE', 'Loan'), createLoan);
router.get('/', protect, getLoans);
router.get('/:id', protect, getLoanById);
router.get('/:id/schedule', protect, getAmortizationSchedule);
router.put('/:id/approve', protect, authorize('Admin', 'super_admin', 'credit_officer', 'Agent'), auditLog('APPROVE', 'Loan'), approveLoan);
router.post('/update-par', protect, authorize('Admin', 'super_admin'), updatePARBuckets);

export default router;
