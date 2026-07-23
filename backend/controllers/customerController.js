import Customer from '../models/Customer.js';
import User from '../models/User.js';

// @desc    Register a new Customer (Dual Auth structure)
// @route   POST /api/customers
// @access  Private (Admin & Agent)
export const registerCustomer = async (req, res) => {
  try {
    const { fullName, phone, pin, address, nicNumber, kycStatus } = req.body;

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

    const customer = await Customer.create({
      fullName,
      phone,
      pin,
      address,
      nicNumber,
      kycStatus: kycStatus || 'Pending',
      registeredBy: req.user._id,
    });

    // Auto-create Customer portal user account using phone/email
    const userEmail = `${phone.replace(/[^0-9]/g, '')}@microfinance.com`;
    const userExists = await User.findOne({ phone });
    if (!userExists) {
      await User.create({
        name: fullName,
        email: userEmail,
        password: pin, // Uses PIN as initial password
        role: 'Customer',
        phone,
        address,
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
      },
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    return res.status(500).json({ message: 'Failed to register customer', error: error.message });
  }
};

// @desc    Get all Customers
// @route   GET /api/customers
// @access  Private (Admin & Agent)
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('registeredBy', 'name role').sort({ createdAt: -1 });
    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving customers' });
  }
};
