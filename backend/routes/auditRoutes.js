import express from 'express';
import { getAuditLogs, getAuditStats } from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const auditRoles = ['Admin', 'super_admin', 'auditor'];

router.get('/', protect, authorize(...auditRoles), getAuditLogs);
router.get('/stats', protect, authorize(...auditRoles), getAuditStats);

export default router;
