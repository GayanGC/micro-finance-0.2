import express from 'express';
import {
  getLoanReport,
  getCollectionReport,
  getOutstandingReport,
  getPnLReport,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const reportAccess = protect, reportRoles = authorize('Admin', 'super_admin', 'auditor');

router.get('/loans', reportAccess, reportRoles, getLoanReport);
router.get('/collections', reportAccess, reportRoles, getCollectionReport);
router.get('/outstanding', reportAccess, reportRoles, getOutstandingReport);
router.get('/pnl', reportAccess, reportRoles, getPnLReport);

export default router;
