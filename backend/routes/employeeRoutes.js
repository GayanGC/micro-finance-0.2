import express from 'express';
import { registerEmployee, getEmployees, getAgents } from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/agents', protect, getAgents);

router.use(protect);
router.use(authorize('Admin', 'super_admin', 'SUPER_ADMIN'));

router.route('/')
  .post(registerEmployee)
  .get(getEmployees);

export default router;
