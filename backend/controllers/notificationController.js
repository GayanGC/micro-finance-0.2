import Notification from '../models/Notification.js';
import { runOverdueAlertScan } from '../utils/notificationScheduler.js';

// @desc    Get all notifications (Admin sees all, others see their own)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    let filter = {};
    const { type, status, channel, limit = 100 } = req.query;

    // Non-admins/auditors see only their notifications
    if (!['Admin', 'super_admin', 'auditor'].includes(req.user.role)) {
      filter.recipient = req.user._id;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (channel) filter.channel = channel;

    const notifications = await Notification.find(filter)
      .populate('customerId', 'fullName phone nicNumber')
      .populate('loanId', 'principalAmount remainingBalance status')
      .populate('recipient', 'name role')
      .sort({ triggeredAt: -1 })
      .limit(Number(limit));

    // Unread count
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Error retrieving notifications', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ message: 'Marked as read', notification });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating notification' });
  }
};

// @desc    Mark notification as sent (gateway delivery confirmation)
// @route   PUT /api/notifications/:id/sent
// @access  Private (Admin)
export const markAsSent = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: 'Sent', sentAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ message: 'Notification marked as sent', notification });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating notification status' });
  }
};

// @desc    Mark all as read for current user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating notifications' });
  }
};

// @desc    Trigger overdue alert scan manually
// @route   POST /api/notifications/trigger-overdue
// @access  Private (Admin, super_admin)
export const triggerOverdueAlerts = async (req, res) => {
  try {
    const result = await runOverdueAlertScan();
    return res.json({
      message: `Overdue scan complete. ${result.triggered} alert(s) triggered.`,
      ...result,
    });
  } catch (error) {
    console.error('Error running overdue scan:', error);
    return res.status(500).json({ message: 'Failed to run overdue alert scan', error: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Admin)
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting notification' });
  }
};
