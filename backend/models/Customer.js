import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
