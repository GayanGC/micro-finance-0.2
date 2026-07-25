import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import { computeCreditScore, scoreToCribCategory } from '../utils/creditScoring.js';
import { triggerNotification } from '../utils/notificationScheduler.js';

// @desc    Register a new Customer (Dual Auth structure)
// @route   POST /api/customers
// @access  Private (Admin & Agent)
export const registerCustomer = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      pin,
      address,
      nicNumber,
      kycStatus,
      monthlyIncome,
      monthlyExpenses,
      employmentType,
      guarantors,
      branch,
    } = req.body;

    if (!fullName || !phone || !pin || !address || !nicNumber) {
      return res.status(400).json({ message: 'Please provide all required customer registration fields.' });
    }

    if (pin.length < 4 || pin.length > 6) {
      return res.status(400).json({ message: 'PIN must be between 4 and 6 digits.' });
    }

    const customerExists = await Customer.findOne({ $or: [{ phone }, { nicNumber }] });
    if (customerExists) {
      return res.status(400).json({ message: 'A customer with this phone number or NIC already exists.' });
    }

    // Compute initial credit score
    const tempCustomer = {
      isBlacklisted: false,
      kycStatus: kycStatus || 'Pending',
      monthlyIncome: monthlyIncome || 0,
      monthlyExpenses: monthlyExpenses || 0,
      cribCategory: 'A',
      createdAt: new Date(),
    };
    const { score, riskTag } = computeCreditScore(tempCustomer, []);
    const cribCategory = scoreToCribCategory(score);

    const customer = await Customer.create({
      fullName,
      phone,
      pin,
      address,
      nicNumber,
      kycStatus: kycStatus || 'Pending',
      registeredBy: req.user._id,
      monthlyIncome: monthlyIncome || 0,
      monthlyExpenses: monthlyExpenses || 0,
      employmentType: employmentType || 'Other',
      guarantors: guarantors || [],
      creditScore: score,
      riskTag,
      cribCategory,
      branch: branch || 'HQ',
    });

    // Auto-create Customer portal user account using phone
    const userEmail = `${phone.replace(/[^0-9]/g, '')}@microfinance.com`;
    const userExists = await User.findOne({ phone });
    if (!userExists) {
      await User.create({
        name: fullName,
        email: userEmail,
        password: pin,
        role: 'Customer',
        phone,
        address,
        branch: branch || 'HQ',
      });
    }

    return res.status(201).json({
      message: 'Customer registered successfully!',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        phone: customer.phone,
        nicNumber: customer.nicNumber,
        kycStatus: customer.kycStatus,
        status: customer.status,
        creditScore: customer.creditScore,
        riskTag: customer.riskTag,
        cribCategory: customer.cribCategory,
      },
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    return res.status(500).json({ message: 'Failed to register customer', error: error.message });
  }
};

// @desc    Get all Customers with filters
// @route   GET /api/customers
// @access  Private (Admin & Agent)
export const getCustomers = async (req, res) => {
  try {
    const { isBlacklisted, kycStatus, cribCategory, branch, riskTag } = req.query;
    const filter = {};

    if (isBlacklisted !== undefined) filter.isBlacklisted = isBlacklisted === 'true';
    if (kycStatus) filter.kycStatus = kycStatus;
    if (cribCategory) filter.cribCategory = cribCategory;
    if (branch) filter.branch = branch;
    if (riskTag) filter.riskTag = riskTag;

    const customers = await Customer.find(filter)
      .populate('registeredBy', 'name role')
      .sort({ createdAt: -1 });

    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving customers' });
  }
};

// @desc    Update customer — KYC, blacklist, income, guarantors, credit score recalculation
// @route   PUT /api/customers/:id
// @access  Private (Admin, credit_officer, super_admin)
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const {
      kycStatus,
      isBlacklisted,
      blacklistReason,
      cribCategory,
      monthlyIncome,
      monthlyExpenses,
      employmentType,
      status,
      guarantors,
      address,
      branch,
    } = req.body;

    // Apply updates
    if (kycStatus !== undefined) customer.kycStatus = kycStatus;
    if (isBlacklisted !== undefined) customer.isBlacklisted = isBlacklisted;
    if (blacklistReason !== undefined) customer.blacklistReason = blacklistReason;
    if (cribCategory !== undefined) customer.cribCategory = cribCategory;
    if (monthlyIncome !== undefined) customer.monthlyIncome = monthlyIncome;
    if (monthlyExpenses !== undefined) customer.monthlyExpenses = monthlyExpenses;
    if (employmentType !== undefined) customer.employmentType = employmentType;
    if (status !== undefined) customer.status = status;
    if (guarantors !== undefined) customer.guarantors = guarantors;
    if (address !== undefined) customer.address = address;
    if (branch !== undefined) customer.branch = branch;

    // Recalculate credit score after updates
    const existingLoans = await Loan.find({ customer: customer._id });
    const { score, riskTag } = computeCreditScore(customer, existingLoans);
    const newCribCategory = cribCategory || scoreToCribCategory(score);

    customer.creditScore = score;
    customer.riskTag = riskTag;
    customer.cribCategory = newCribCategory;

    await customer.save();

    // Trigger KYC notification
    if (kycStatus) {
      await triggerNotification('kyc_update', {
        customerId: customer._id,
        metadata: { kycStatus },
      });
    }

    // Trigger blacklist notification
    if (isBlacklisted === true) {
      await triggerNotification('blacklist_alert', {
        customerId: customer._id,
        metadata: { reason: blacklistReason },
      });
    }

    return res.json({
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
};

// @desc    Recalculate credit score for a specific customer
// @route   POST /api/customers/:id/score
// @access  Private (Admin, credit_officer, super_admin)
export const recalculateCreditScore = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const existingLoans = await Loan.find({ customer: customer._id });
    const { score, riskTag, breakdown } = computeCreditScore(customer, existingLoans);
    const cribCategory = scoreToCribCategory(score);

    customer.creditScore = score;
    customer.riskTag = riskTag;
    customer.cribCategory = cribCategory;
    await customer.save();

    return res.json({
      message: 'Credit score recalculated',
      creditScore: score,
      riskTag,
      cribCategory,
      breakdown,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to recalculate credit score', error: error.message });
  }
};
