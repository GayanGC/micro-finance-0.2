import mongoose from 'mongoose';

const gpsLocationSchema = new mongoose.Schema({
  lat: { type: Number },
  lng: { type: Number },
  accuracy: { type: Number },
  capturedAt: { type: Date, default: Date.now },
}, { _id: false });

const repaymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan ID is required'],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Mobile Pay', 'Agent Doorstep', 'Online Gateway', 'Cheque', 'Kiosk'],
      default: 'Cash',
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    newRemainingBalance: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // === GPS Tracking (Field Agent Collections) ===
    gpsLocation: {
      type: gpsLocationSchema,
      default: null,
    },

    // === Online Payment Flag ===
    isOnlinePayment: {
      type: Boolean,
      default: false,
    },

    // === Penalty Paid ===
    penaltyPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // === Offline Sync Support ===
    offlineSynced: {
      type: Boolean,
      default: false,
    },
    offlineCreatedAt: {
      type: Date,
      default: null,
    },

    // === Cheque-specific ===
    chequeNumber: {
      type: String,
      default: '',
    },
    chequeStatus: {
      type: String,
      enum: ['Pending', 'Cleared', 'Bounced', 'N/A'],
      default: 'N/A',
    },

    // === Notes ===
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Repayment = mongoose.model('Repayment', repaymentSchema);
export default Repayment;
