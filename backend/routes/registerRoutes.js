import express from 'express';
import {
  openRegister,
  getActiveRegister,
  closeRegister,
  getAllRegisters,
} from '../controllers/registerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

const staffRoles = ['Admin', 'Agent', 'super_admin', 'auditor', 'credit_officer'];

router.get('/active', protect, authorize(...staffRoles), getActiveRegister);
router.post('/open', protect, authorize(...staffRoles), auditLog('CREATE', 'CashRegister'), openRegister);
router.post('/close', protect, authorize(...staffRoles), auditLog('UPDATE', 'CashRegister'), closeRegister);
router.get('/', protect, authorize(...staffRoles), getAllRegisters);

export default router;
