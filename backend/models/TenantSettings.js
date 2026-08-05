import mongoose from 'mongoose';

const tenantSettingsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    currencySymbol: {
      type: String,
      default: '$',
      trim: true,
    },
    currencyCode: {
      type: String,
      default: 'USD',
      trim: true,
    },
    systemName: {
      type: String,
      default: 'Microfinance Core Banking v2.0',
      trim: true,
    },
    companyName: {
      type: String,
      default: 'Microfinance Core Banking',
      trim: true,
    },
    companyAddress: {
      type: String,
      default: '123 Main Street, Suite 400, Financial District',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: 'support@microfinance.com',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+1 800 555 0199',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    directorSignatureUrl: {
      type: String,
      default: '',
      trim: true,
    },
    companySealUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

const TenantSettings = mongoose.models.TenantSettings || mongoose.model('TenantSettings', tenantSettingsSchema);
export default TenantSettings;
