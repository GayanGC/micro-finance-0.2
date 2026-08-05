import express from 'express';
import {
  getMyProfile,
  getMyLoans,
  getMySettlements,
} from '../controllers/customerPortalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected portal endpoints for logged-in Customer users
router.get('/profile', protect, getMyProfile);
router.get('/loans', protect, getMyLoans);
router.get('/settlements', protect, getMySettlements);

export default router;
