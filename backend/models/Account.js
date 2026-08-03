import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      unique: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'],
      required: [true, 'Account type is required'],
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
export default Account;
