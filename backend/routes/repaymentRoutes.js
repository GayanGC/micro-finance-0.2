import express from 'express';
import { addRepayment, getRepayments } from '../controllers/repaymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/add', authorize('Admin', 'Agent'), addRepayment);
router.get('/', getRepayments);

export default router;
