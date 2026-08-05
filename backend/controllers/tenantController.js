import Tenant from '../models/Tenant.js';

// @desc    Register a new tenant company / subscriber
// @route   POST /api/tenants
// @access  Private (SUPER_ADMIN, super_admin, Admin)
export const createTenant = async (req, res) => {
  try {
    const {
      companyName,
      adminEmail,
      contactNumber,
      subscriptionPackage,
      subscriptionStatus,
      subscriptionExpiry,
      monthlyFee,
      maxUsers,
      maxLoans,
      notes,
    } = req.body;

    if (!companyName || !adminEmail || !contactNumber) {
      return res.status(400).json({ message: 'Company name, admin email, and contact number are required.' });
    }

    const existingTenant = await Tenant.findOne({
      $or: [{ companyName: companyName.trim() }, { adminEmail: adminEmail.trim().toLowerCase() }],
    });

    if (existingTenant) {
      return res.status(400).json({ message: 'A tenant company with this name or admin email already exists.' });
    }

    // Default expiry to 1 year if not provided
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    const feeMap = { Lite: 49, Standard: 149, Premium: 299 };
    const pkg = subscriptionPackage || 'Lite';
    const fee = monthlyFee !== undefined ? Number(monthlyFee) : (feeMap[pkg] || 49);

    const tenant = await Tenant.create({
      companyName: companyName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      contactNumber: contactNumber.trim(),
      subscriptionPackage: pkg,
      subscriptionStatus: subscriptionStatus || 'Active',
      subscriptionExpiry: subscriptionExpiry ? new Date(subscriptionExpiry) : defaultExpiry,
      monthlyFee: fee,
      maxUsers: maxUsers ? Number(maxUsers) : pkg === 'Premium' ? 100 : pkg === 'Standard' ? 25 : 10,
      maxLoans: maxLoans ? Number(maxLoans) : pkg === 'Premium' ? 5000 : pkg === 'Standard' ? 1000 : 200,
      notes: notes || '',
    });

    return res.status(201).json({ message: 'Tenant organization created successfully!', tenant });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return res.status(500).json({ message: 'Failed to create tenant organization', error: error.message });
  }
};

// @desc    Get all tenants with aggregated MRR & subscriber metrics
// @route   GET /api/tenants
// @access  Private (SUPER_ADMIN, super_admin, Admin, auditor)
export const getAllTenants = async (req, res) => {
  try {
    const { status, package: pkg, search } = req.query;
    const filter = {};

    if (status) filter.subscriptionStatus = status;
    if (pkg) filter.subscriptionPackage = pkg;
    if (search) {
      filter.$or = [
        { companyName: new RegExp(search, 'i') },
        { adminEmail: new RegExp(search, 'i') },
        { contactNumber: new RegExp(search, 'i') },
      ];
    }

    let tenants = await Tenant.find(filter).sort({ createdAt: -1 });

    // Seed sample tenant subscriptions if database has no tenants
    if (tenants.length === 0 && !status && !pkg && !search) {
      const sampleTenants = [
        {
          companyName: 'Lanka Micro Capital (Pvt) Ltd',
          adminEmail: 'admin@lankamicro.lk',
          contactNumber: '+94112345678',
          subscriptionPackage: 'Premium',
          subscriptionStatus: 'Active',
          subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          monthlyFee: 299,
          maxUsers: 100,
          maxLoans: 5000,
          notes: 'Enterprise customer - Colombo HQ',
        },
        {
          companyName: 'Apex Credit Services',
          adminEmail: 'info@apexcredit.com',
          contactNumber: '+94771234567',
          subscriptionPackage: 'Standard',
          subscriptionStatus: 'Active',
          subscriptionExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          monthlyFee: 149,
          maxUsers: 25,
          maxLoans: 1000,
          notes: 'Standard tier - Kandy Branch',
        },
        {
          companyName: 'Rural Development Finance',
          adminEmail: 'support@rdfinance.org',
          contactNumber: '+94719876543',
          subscriptionPackage: 'Lite',
          subscriptionStatus: 'Active',
          subscriptionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          monthlyFee: 49,
          maxUsers: 10,
          maxLoans: 200,
          notes: 'Starter Lite package',
        },
        {
          companyName: 'Vision Micro Lending',
          adminEmail: 'contact@visionmicro.lk',
          contactNumber: '+94755554433',
          subscriptionPackage: 'Standard',
          subscriptionStatus: 'Suspended',
          subscriptionExpiry: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          monthlyFee: 149,
          maxUsers: 25,
          maxLoans: 1000,
          notes: 'Payment overdue - account suspended',
        },
      ];
      tenants = await Tenant.insertMany(sampleTenants);
    }

    // Compute SaaS KPI Metrics
    const allTenants = await Tenant.find();
    const now = new Date();

    const summary = {
      totalTenants: allTenants.length,
      activeTenants: allTenants.filter((t) => t.subscriptionStatus === 'Active' && new Date(t.subscriptionExpiry) > now).length,
      suspendedTenants: allTenants.filter((t) => t.subscriptionStatus === 'Suspended').length,
      expiredTenants: allTenants.filter((t) => t.subscriptionStatus === 'Expired' || new Date(t.subscriptionExpiry) <= now).length,
      monthlyRecurringRevenue: allTenants
        .filter((t) => t.subscriptionStatus === 'Active')
        .reduce((sum, t) => sum + (t.monthlyFee || 0), 0),
      packageBreakdown: {
        Lite: allTenants.filter((t) => t.subscriptionPackage === 'Lite').length,
        Standard: allTenants.filter((t) => t.subscriptionPackage === 'Standard').length,
        Premium: allTenants.filter((t) => t.subscriptionPackage === 'Premium').length,
      },
    };

    return res.json({ tenants, summary });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return res.status(500).json({ message: 'Failed to fetch tenant list', error: error.message });
  }
};

// @desc    Get tenant details by ID
// @route   GET /api/tenants/:id
// @access  Private (SUPER_ADMIN, super_admin, Admin)
export const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant organization not found.' });
    }
    return res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return res.status(500).json({ message: 'Failed to fetch tenant', error: error.message });
  }
};

// @desc    Update Tenant Subscription details / Renew / Upgrade
// @route   PUT /api/tenants/:id
// @access  Private (SUPER_ADMIN, super_admin, Admin)
export const updateTenant = async (req, res) => {
  try {
    const {
      companyName,
      adminEmail,
      contactNumber,
      subscriptionPackage,
      subscriptionStatus,
      subscriptionExpiry,
      monthlyFee,
      maxUsers,
      maxLoans,
      notes,
    } = req.body;

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant organization not found.' });
    }

    if (companyName) tenant.companyName = companyName.trim();
    if (adminEmail) tenant.adminEmail = adminEmail.trim().toLowerCase();
    if (contactNumber) tenant.contactNumber = contactNumber.trim();
    if (subscriptionPackage) tenant.subscriptionPackage = subscriptionPackage;
    if (subscriptionStatus) tenant.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiry) tenant.subscriptionExpiry = new Date(subscriptionExpiry);
    if (monthlyFee !== undefined) tenant.monthlyFee = Number(monthlyFee);
    if (maxUsers !== undefined) tenant.maxUsers = Number(maxUsers);
    if (maxLoans !== undefined) tenant.maxLoans = Number(maxLoans);
    if (notes !== undefined) tenant.notes = notes.trim();

    await tenant.save();

    return res.json({ message: 'Tenant subscription updated successfully!', tenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return res.status(500).json({ message: 'Failed to update tenant subscription', error: error.message });
  }
};

// @desc    Delete a Tenant organization
// @route   DELETE /api/tenants/:id
// @access  Private (SUPER_ADMIN, super_admin, Admin)
export const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant organization not found.' });
    }
    return res.json({ message: 'Tenant organization deleted successfully!' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return res.status(500).json({ message: 'Failed to delete tenant', error: error.message });
  }
};
