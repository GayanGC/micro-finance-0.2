import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    referenceId: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Journal entry description is required'],
      trim: true,
    },
    debitAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Debit account is required'],
    },
    creditAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Credit account is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
