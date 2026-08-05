import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const guarantorSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  nicNumber: { type: String, trim: true },
  phone: { type: String, trim: true },
  relationship: { type: String, trim: true },
  monthlyIncome: { type: Number, default: 0 },
  incomeProof: { type: String, default: '' }, // file path / URL stub
  address: { type: String, default: '' },
}, { _id: true });

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Customer full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    pin: {
      type: String,
      required: [true, 'Security PIN (4-6 digits) is required'],
      select: false,
    },
    address: {
      type: String,
      required: [true, 'Customer address is required'],
    },
    nicNumber: {
      type: String,
      required: [true, 'NIC / Identity Number is required'],
      unique: true,
      trim: true,
    },
    kycStatus: {
      type: String,
      enum: ['Verified', 'Pending', 'Rejected'],
      default: 'Pending',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blocked'],
      default: 'Active',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // === Risk & CRIB Management ===
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    blacklistReason: {
      type: String,
      default: '',
    },
    cribCategory: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      default: 'A',
    },
    creditScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 850,
    },
    riskTag: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Very High'],
      default: 'Low',
    },

    // === Financial Profile ===
    monthlyIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
    employmentType: {
      type: String,
      enum: ['Employed', 'Self-Employed', 'Business Owner', 'Unemployed', 'Other'],
      default: 'Other',
    },

    // === Multi-Guarantor Support ===
    guarantors: {
      type: [guarantorSchema],
      default: [],
    },

    // === Organizational Hierarchy ===
    branch: {
      type: String,
      default: 'HQ',
      trim: true,
    },
    center: {
      type: String,
      default: '',
      trim: true,
    },
    group: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash PIN before saving customer
customerSchema.pre('save', async function (next) {
  if (!this.isModified('pin')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// Match hashed PIN
customerSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
