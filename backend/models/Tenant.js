import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company / Organization name is required'],
      trim: true,
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email address is required'],
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    subscriptionPackage: {
      type: String,
      enum: ['Lite', 'Standard', 'Premium'],
      default: 'Lite',
    },
    subscriptionStatus: {
      type: String,
      enum: ['Active', 'Suspended', 'Expired'],
      default: 'Active',
    },
    subscriptionExpiry: {
      type: Date,
      required: [true, 'Subscription expiry date is required'],
    },
    monthlyFee: {
      type: Number,
      default: 0,
      min: [0, 'Monthly fee cannot be negative'],
    },
    maxUsers: {
      type: Number,
      default: 10,
    },
    maxLoans: {
      type: Number,
      default: 100,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
export default Tenant;
