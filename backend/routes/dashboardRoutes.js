import express from 'express';
import { getDashboardAnalytics } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const staffRoles = ['Admin', 'Agent', 'super_admin', 'auditor', 'credit_officer'];

router.get('/analytics', protect, authorize(...staffRoles), getDashboardAnalytics);

export default router;
