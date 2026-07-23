import express from 'express';
import { calculateLoan, createLoan, getLoans } from '../controllers/loanController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/calculate', calculateLoan);

router.route('/')
  .get(getLoans)
  .post(authorize('Admin', 'Agent'), createLoan);

export default router;
