import express from 'express';
import { registerEmployee, getEmployees } from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .post(registerEmployee)
  .get(getEmployees);

export default router;
