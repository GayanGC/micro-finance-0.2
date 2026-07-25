/**
 * Notification Scheduler / Trigger Utility
 * Creates notification log records for various events.
 * Gateway integration (SMS/WhatsApp) can be wired in here later.
 */
import Notification from '../models/Notification.js';
import Loan from '../models/Loan.js';

/**
 * Trigger a specific notification event
 * @param {string} type - Notification type key
 * @param {Object} context - { loanId, customerId, recipientUserId, metadata }
 */
export const triggerNotification = async (type, context = {}) => {
  try {
    const { loanId, customerId, recipientUserId, metadata = {} } = context;

    const messageTemplates = {
      loan_approval: {
        title: 'Loan Approved ✅',
        message: `Your loan application has been approved. Disbursement is in progress.`,
        channel: 'In-App',
      },
      loan_rejection: {
        title: 'Loan Application Rejected ❌',
        message: `Your loan application has been rejected. Please contact your agent for details.`,
        channel: 'In-App',
      },
      overdue_7d: {
        title: 'Payment Reminder – 7 Days Overdue ⚠️',
        message: `Your EMI payment is 7 days overdue. Please make the payment immediately to avoid penalties.`,
        channel: 'SMS',
      },
      overdue_14d: {
        title: 'Urgent: 14-Day Overdue Notice 🔴',
        message: `Your loan is 14 days overdue. Additional penalties are being accrued. Please contact your branch immediately.`,
        channel: 'SMS',
      },
      overdue_30d: {
        title: 'CRITICAL: 30-Day Default Warning 🚨',
        message: `Your account is 30 days past due and is being reported. Contact us immediately to avoid further legal action.`,
        channel: 'WhatsApp',
      },
      overdue_90d: {
        title: 'FINAL NOTICE: 90-Day Default 🚨',
        message: `Your account is 90+ days in default and has been referred to the recovery team. Immediate action required.`,
        channel: 'WhatsApp',
      },
      payment_received: {
        title: 'Payment Received ✅',
        message: `Your payment has been successfully recorded. Thank you!`,
        channel: 'In-App',
      },
      loan_completed: {
        title: 'Loan Fully Paid Off 🎉',
        message: `Congratulations! Your loan has been fully repaid. Thank you for your timely payments.`,
        channel: 'In-App',
      },
      kyc_update: {
        title: 'KYC Status Updated',
        message: `Your KYC verification status has been updated. Please check your profile for details.`,
        channel: 'In-App',
      },
      blacklist_alert: {
        title: 'Account Restricted',
        message: `Your account has been flagged and restricted. Please contact the branch manager.`,
        channel: 'In-App',
      },
      system: {
        title: metadata.title || 'System Notification',
        message: metadata.message || 'A system event has occurred.',
        channel: 'In-App',
      },
    };

    const template = messageTemplates[type] || messageTemplates.system;

    const notification = await Notification.create({
      recipient: recipientUserId || null,
      customerId: customerId || null,
      loanId: loanId || null,
      type,
      title: template.title,
      message: template.message,
      channel: template.channel,
      status: 'Pending',
      triggeredBy: 'Auto',
      metadata,
    });

    // === Gateway Hook (stub) ===
    // In production, wire to Twilio/WhatsApp API here:
    // if (template.channel === 'SMS') await sendSMS(phone, template.message);
    // if (template.channel === 'WhatsApp') await sendWhatsApp(phone, template.message);

    return notification;
  } catch (error) {
    console.error(`[NotificationScheduler] Failed to create notification (${type}):`, error.message);
    return null;
  }
};

/**
 * Scan all active loans and trigger overdue notifications
 * This is intended to be called by a scheduled cron job.
 */
export const runOverdueAlertScan = async () => {
  try {
    const today = new Date();
    const activeLoans = await Loan.find({ status: 'Active' }).populate('customer');

    let triggered = 0;

    for (const loan of activeLoans) {
      if (!loan.nextDueDate) continue;

      const nextDue = new Date(loan.nextDueDate);
      const overdueDays = Math.floor((today - nextDue) / (1000 * 60 * 60 * 24));

      if (overdueDays <= 0) continue;

      const customerId = loan.customer?._id;
      const loanId = loan._id;
      const context = { loanId, customerId, metadata: { overdueDays } };

      if (overdueDays >= 90) {
        await triggerNotification('overdue_90d', context);
      } else if (overdueDays >= 30) {
        await triggerNotification('overdue_30d', context);
      } else if (overdueDays >= 14) {
        await triggerNotification('overdue_14d', context);
      } else if (overdueDays >= 7) {
        await triggerNotification('overdue_7d', context);
      }

      triggered++;
    }

    return { triggered, scannedAt: today.toISOString() };
  } catch (error) {
    console.error('[NotificationScheduler] Overdue scan failed:', error.message);
    return { triggered: 0, error: error.message };
  }
};
