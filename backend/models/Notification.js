import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
    },
    type: {
      type: String,
      enum: [
        'loan_approval',
        'loan_rejection',
        'overdue_7d',
        'overdue_14d',
        'overdue_30d',
        'overdue_90d',
        'payment_received',
        'loan_completed',
        'kyc_update',
        'blacklist_alert',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['SMS', 'WhatsApp', 'Email', 'In-App'],
      default: 'In-App',
    },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed', 'Delivered'],
      default: 'Pending',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    triggeredBy: {
      type: String,
      enum: ['System', 'Admin', 'Agent', 'Auto'],
      default: 'Auto',
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    sentAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
