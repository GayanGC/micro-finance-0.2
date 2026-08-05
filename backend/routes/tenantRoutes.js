import express from 'express';
import {
  createTenant,
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
} from '../controllers/tenantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

const superAdminRoles = ['SUPER_ADMIN', 'super_admin', 'Admin'];

router.get('/', protect, authorize(...superAdminRoles), getAllTenants);
router.post('/', protect, authorize(...superAdminRoles), auditLog('CREATE', 'Tenant'), createTenant);
router.get('/:id', protect, authorize(...superAdminRoles), getTenantById);
router.put('/:id', protect, authorize(...superAdminRoles), auditLog('UPDATE', 'Tenant'), updateTenant);
router.delete('/:id', protect, authorize(...superAdminRoles), auditLog('DELETE', 'Tenant'), deleteTenant);

export default router;
