import express from 'express';
import { createPolicy, getPolicies } from '../controllers/policyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPolicies)
  .post(authorize('Admin'), createPolicy);

export default router;
