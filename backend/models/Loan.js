import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: [true, 'Loan policy is required'],
    },
    principalAmount: {
      type: Number,
      required: [true, 'Principal amount is required'],
      min: 1,
    },
    totalInterest: {
      type: Number,
      required: [true, 'Total interest is required'],
      min: 0,
    },
    totalPayable: {
      type: Number,
      required: [true, 'Total payable amount is required'],
      min: 1,
    },
    monthlyInstallment: {
      type: Number,
      required: [true, 'Monthly installment EMI is required'],
      min: 0.01,
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    collateralDetails: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Active', 'Completed', 'Defaulted'],
      default: 'Active',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
