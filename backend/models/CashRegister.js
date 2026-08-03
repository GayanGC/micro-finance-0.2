import mongoose from 'mongoose';

const cashRegisterSchema = new mongoose.Schema(
  {
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cashier reference is required'],
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    openTime: {
      type: Date,
      default: Date.now,
    },
    closeTime: {
      type: Date,
    },
    startingBalance: {
      type: Number,
      required: [true, 'Starting cash float is required'],
      min: [0, 'Starting balance cannot be negative'],
    },
    closingBalance: {
      type: Number,
      default: 0,
    },
    expectedBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const CashRegister = mongoose.models.CashRegister || mongoose.model('CashRegister', cashRegisterSchema);
export default CashRegister;
