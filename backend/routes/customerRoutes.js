import express from 'express';
import { registerCustomer, getCustomers } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'Agent'));

router.route('/')
  .post(registerCustomer)
  .get(getCustomers);

export default router;
