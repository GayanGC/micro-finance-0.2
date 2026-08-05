import express from 'express';
import {
  getLoanReport,
  getCollectionReport,
  getOutstandingReport,
  getPnLReport,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireSubscriptionTier } from '../middleware/tenantGatingMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'super_admin', 'auditor', 'SUPER_ADMIN'));
router.use(requireSubscriptionTier('Standard'));

router.get('/loans', getLoanReport);
router.get('/collections', getCollectionReport);
router.get('/outstanding', getOutstandingReport);
router.get('/pnl', getPnLReport);

export default router;
