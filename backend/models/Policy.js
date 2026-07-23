import mongoose from 'mongoose';

const policySchema = new mongoose.Schema(
  {
    policyName: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
    },
    interestRate: {
      type: Number,
      required: [true, 'Annual interest rate percentage is required'],
      min: 0,
    },
    durationMonths: {
      type: Number,
      required: [true, 'Duration in months is required'],
      min: 1,
    },
    interestType: {
      type: String,
      enum: ['Flat', 'Reducing Balance'],
      default: 'Flat',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Policy = mongoose.model('Policy', policySchema);
export default Policy;
