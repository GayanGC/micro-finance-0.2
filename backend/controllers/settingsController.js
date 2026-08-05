import TenantSettings from '../models/TenantSettings.js';
import Customer from '../models/Customer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';

// @desc    Get Tenant Settings & Localization Configuration
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    let settings = await TenantSettings.findOne();

    if (!settings) {
      settings = await TenantSettings.create({
        currencySymbol: '$',
        currencyCode: 'USD',
        systemName: 'Microfinance Core Banking v2.0',
        companyName: 'Microfinance Core Banking System',
        companyAddress: '123 Financial District, Suite 400, Colombo',
        contactEmail: 'info@microfinance-bank.com',
        contactPhone: '+94 11 234 5678',
        directorSignatureUrl: '',
        companySealUrl: '',
      });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

// @desc    Update Tenant Settings, Localization & Letterhead
// @route   PUT /api/settings
// @access  Private (Admin, SUPER_ADMIN, super_admin)
export const updateSettings = async (req, res) => {
  try {
    const {
      currencySymbol,
      currencyCode,
      systemName,
      companyName,
      companyAddress,
      contactEmail,
      contactPhone,
      logoUrl,
      directorSignatureUrl,
      companySealUrl,
    } = req.body;

    let settings = await TenantSettings.findOne();

    if (!settings) {
      settings = new TenantSettings();
    }

    if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol.trim();
    if (currencyCode !== undefined) settings.currencyCode = currencyCode.trim();
    if (systemName !== undefined) settings.systemName = systemName.trim();
    if (companyName !== undefined) settings.companyName = companyName.trim();
    if (companyAddress !== undefined) settings.companyAddress = companyAddress.trim();
    if (contactEmail !== undefined) settings.contactEmail = contactEmail.trim();
    if (contactPhone !== undefined) settings.contactPhone = contactPhone.trim();
    if (logoUrl !== undefined) settings.logoUrl = logoUrl.trim();
    if (directorSignatureUrl !== undefined) settings.directorSignatureUrl = directorSignatureUrl.trim();
    if (companySealUrl !== undefined) settings.companySealUrl = companySealUrl.trim();

    await settings.save();

    return res.json({
      message: 'Settings and letterhead assets updated successfully!',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

// @desc    Export JSON snapshot backup of database
// @route   GET /api/settings/backup
// @access  Private (Admin, SUPER_ADMIN, super_admin)
export const exportDatabaseBackup = async (req, res) => {
  try {
    const [customers, loans, repayments] = await Promise.all([
      Customer.find().lean(),
      Loan.find().lean(),
      Repayment.find().lean(),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      system: 'Microfinance Core Banking ERP v2.0',
      recordCounts: {
        customers: customers.length,
        loans: loans.length,
        repayments: repayments.length,
      },
      customers,
      loans,
      repayments,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=Database_Backup_${Date.now()}.json`);
    return res.json(backupData);
  } catch (error) {
    console.error('Error creating database backup:', error);
    return res.status(500).json({ message: 'Failed to export database backup', error: error.message });
  }
};
