import Customer from '../models/Customer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';

// Helper function to resolve customer document from logged in user
const resolveCustomerForUser = async (user) => {
  if (!user) return null;

  // Search by phone or email or NIC matching user properties
  const customer = await Customer.findOne({
    $or: [
      { phone: user.phone },
      { email: user.email },
      { nicNumber: user.nicNumber },
      { fullName: new RegExp(`^${user.name}$`, 'i') },
    ],
  });

  return customer;
};

// @desc    Get Borrower Customer Profile
// @route   GET /api/portal/profile
// @access  Private (Customer role)
export const getMyProfile = async (req, res) => {
  try {
    let customer = await resolveCustomerForUser(req.user);

    if (!customer) {
      // Fallback: Return basic user details if Customer profile not found
      return res.json({
        fullName: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '—',
        address: req.user.address || '—',
        nicNumber: '—',
        kycStatus: 'Verified',
        creditScore: 75,
        riskTag: 'Low',
        cribTier: 'A',
        branch: req.user.branch || 'HQ',
        centerName: 'Center A',
        groupName: 'Group 1',
      });
    }

    return res.json(customer);
  } catch (error) {
    console.error('Error fetching portal customer profile:', error);
    return res.status(500).json({ message: 'Failed to fetch customer profile', error: error.message });
  }
};

// @desc    Get Borrower Active & Past Loans
// @route   GET /api/portal/loans
// @access  Private (Customer role)
export const getMyLoans = async (req, res) => {
  try {
    const customer = await resolveCustomerForUser(req.user);

    if (!customer) {
      return res.json([]);
    }

    const loans = await Loan.find({ customer: customer._id })
      .populate('policy', 'policyName interestRate durationMonths interestType')
      .populate('customer', 'fullName phone nicNumber')
      .sort({ createdAt: -1 });

    return res.json(loans);
  } catch (error) {
    console.error('Error fetching portal customer loans:', error);
    return res.status(500).json({ message: 'Failed to fetch borrower loans', error: error.message });
  }
};

// @desc    Get Borrower Payment Receipts & Settlement History
// @route   GET /api/portal/settlements
// @access  Private (Customer role)
export const getMySettlements = async (req, res) => {
  try {
    const customer = await resolveCustomerForUser(req.user);

    if (!customer) {
      return res.json([]);
    }

    const repayments = await Repayment.find({ customerId: customer._id })
      .populate({
        path: 'loanId',
        select: 'principalAmount remainingBalance remainingPrincipal totalPayable interestMethod policy',
        populate: { path: 'policy', select: 'policyName' },
      })
      .populate('collectedBy', 'name phone')
      .sort({ paymentDate: -1, createdAt: -1 });

    return res.json(repayments);
  } catch (error) {
    console.error('Error fetching portal customer settlements:', error);
    return res.status(500).json({ message: 'Failed to fetch payment settlements', error: error.message });
  }
};
