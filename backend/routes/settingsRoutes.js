import express from 'express';
import {
  getSettings,
  updateSettings,
  exportDatabaseBackup,
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

const adminRoles = ['Admin', 'SUPER_ADMIN', 'super_admin'];

router.get('/', protect, getSettings);
router.put('/', protect, authorize(...adminRoles), auditLog('UPDATE', 'TenantSettings'), updateSettings);
router.get('/backup', protect, authorize(...adminRoles), exportDatabaseBackup);

export default router;
