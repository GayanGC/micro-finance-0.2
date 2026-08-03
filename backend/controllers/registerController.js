import CashRegister from '../models/CashRegister.js';
import Repayment from '../models/Repayment.js';

// @desc    Open a new Cashier Register / Shift Session
// @route   POST /api/registers/open
// @access  Private (Admin, Agent, super_admin, credit_officer)
export const openRegister = async (req, res) => {
  try {
    const { startingBalance, branch, notes } = req.body;

    const numStarting = Number(startingBalance);
    if (isNaN(numStarting) || numStarting < 0) {
      return res.status(400).json({ message: 'Please provide a valid starting cash float (>= 0).' });
    }

    // Check if the user already has an active OPEN shift
    const activeRegister = await CashRegister.findOne({
      cashier: req.user._id,
      status: 'OPEN',
    });

    if (activeRegister) {
      return res.status(400).json({
        message: 'You already have an active OPEN register shift session. Please close it before opening a new shift.',
        register: activeRegister,
      });
    }

    const register = await CashRegister.create({
      cashier: req.user._id,
      branch: branch || req.user.branch || '',
      startingBalance: numStarting,
      status: 'OPEN',
      openTime: new Date(),
      notes: notes || '',
    });

    const populated = await CashRegister.findById(register._id).populate('cashier', 'name email role');

    return res.status(201).json({
      message: 'Cash register shift opened successfully!',
      register: populated,
    });
  } catch (error) {
    console.error('Error opening register:', error);
    return res.status(500).json({ message: 'Failed to open register shift', error: error.message });
  }
};

// @desc    Get currently active OPEN register for logged-in user with live expected balance
// @route   GET /api/registers/active
// @access  Private
export const getActiveRegister = async (req, res) => {
  try {
    const register = await CashRegister.findOne({
      cashier: req.user._id,
      status: 'OPEN',
    }).populate('cashier', 'name email role');

    if (!register) {
      return res.json({ active: false, register: null, totalCollections: 0, expectedBalance: 0 });
    }

    // Calculate sum of payments collected by this cashier since register.openTime
    const collectionsAgg = await Repayment.aggregate([
      {
        $match: {
          collectedBy: req.user._id,
          paymentDate: { $gte: register.openTime },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCollections = Math.round((collectionsAgg[0]?.total || 0) * 100) / 100;
    const collectionsCount = collectionsAgg[0]?.count || 0;
    const expectedBalance = Math.round((register.startingBalance + totalCollections) * 100) / 100;

    return res.json({
      active: true,
      register,
      totalCollections,
      collectionsCount,
      expectedBalance,
    });
  } catch (error) {
    console.error('Error fetching active register:', error);
    return res.status(500).json({ message: 'Failed to fetch active register', error: error.message });
  }
};

// @desc    Close active Cashier Register shift session
// @route   POST /api/registers/close
// @access  Private
export const closeRegister = async (req, res) => {
  try {
    const { closingBalance, notes } = req.body;

    const numClosing = Number(closingBalance);
    if (isNaN(numClosing) || numClosing < 0) {
      return res.status(400).json({ message: 'Please provide a valid physical closing cash count (>= 0).' });
    }

    const register = await CashRegister.findOne({
      cashier: req.user._id,
      status: 'OPEN',
    });

    if (!register) {
      return res.status(404).json({ message: 'No active OPEN shift session found to close.' });
    }

    // Calculate exact final expected balance at closing moment
    const collectionsAgg = await Repayment.aggregate([
      {
        $match: {
          collectedBy: req.user._id,
          paymentDate: { $gte: register.openTime },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]);

    const totalCollections = Math.round((collectionsAgg[0]?.total || 0) * 100) / 100;
    const finalExpectedBalance = Math.round((register.startingBalance + totalCollections) * 100) / 100;
    const discrepancy = Math.round((numClosing - finalExpectedBalance) * 100) / 100;

    register.closeTime = new Date();
    register.closingBalance = numClosing;
    register.expectedBalance = finalExpectedBalance;
    register.status = 'CLOSED';
    if (notes) register.notes = notes.trim();

    await register.save();

    const populated = await CashRegister.findById(register._id).populate('cashier', 'name email role');

    return res.json({
      message: 'Cash register shift closed successfully!',
      register: populated,
      totalCollections,
      expectedBalance: finalExpectedBalance,
      closingBalance: numClosing,
      discrepancy,
    });
  } catch (error) {
    console.error('Error closing register:', error);
    return res.status(500).json({ message: 'Failed to close register shift', error: error.message });
  }
};

// @desc    Get all historical register shifts (Audit log for Admins/Managers)
// @route   GET /api/registers
// @access  Private (Admin, Agent, super_admin, auditor, credit_officer)
export const getAllRegisters = async (req, res) => {
  try {
    const { status, cashierId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (cashierId) filter.cashier = cashierId;

    const registers = await CashRegister.find(filter)
      .populate('cashier', 'name email role')
      .sort({ createdAt: -1 });

    return res.json(registers);
  } catch (error) {
    console.error('Error fetching register history:', error);
    return res.status(500).json({ message: 'Failed to fetch register shift logs', error: error.message });
  }
};
