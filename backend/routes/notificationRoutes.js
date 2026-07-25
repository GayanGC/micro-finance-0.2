import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAsSent,
  markAllRead,
  triggerOverdueAlerts,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllRead);
router.post('/trigger-overdue', protect, authorize('Admin', 'super_admin'), triggerOverdueAlerts);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/sent', protect, authorize('Admin', 'super_admin'), markAsSent);
router.delete('/:id', protect, authorize('Admin', 'super_admin'), deleteNotification);

export default router;
