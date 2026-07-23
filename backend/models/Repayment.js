import mongoose from 'mongoose';

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
      enum: ['Cash', 'Bank Transfer', 'Mobile Pay', 'Agent Doorstep'],
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
  },
  {
    timestamps: true,
  }
);

const Repayment = mongoose.model('Repayment', repaymentSchema);
export default Repayment;
