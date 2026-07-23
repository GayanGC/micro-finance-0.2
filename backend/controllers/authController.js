import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'microfinance_jwt_secret_key_2026_super_secure', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, phone, identifier, password, role, loginType } = req.body;
    const userEmailOrPhone = email || phone || identifier;

    const demoAccounts = {
      'admin@microfinance.com': { name: 'System Administrator', role: 'Admin', phone: '+1 (555) 019-2831', address: 'HQ Financial District' },
      'agent@microfinance.com': { name: 'John Field Agent', role: 'Agent', phone: '+1 (555) 014-9922', address: 'Branch 04 - Sector B' },
      'customer@microfinance.com': { name: 'Sarah Customer', role: 'Customer', phone: '+1 (555) 018-3344', address: '42 Main St, Greenfield' },
    };

    const targetRole = role || loginType || (userEmailOrPhone && demoAccounts[userEmailOrPhone.toLowerCase()]?.role);

    // Direct role-based login without requiring email field
    if (!userEmailOrPhone && targetRole) {
      const demoEmailMap = {
        Admin: 'admin@microfinance.com',
        Agent: 'agent@microfinance.com',
        Customer: 'customer@microfinance.com',
      };
      const demoEmail = demoEmailMap[targetRole] || 'admin@microfinance.com';
      let user = await User.findOne({ email: demoEmail });
      if (!user) {
        const demoData = demoAccounts[demoEmail];
        user = await User.create({
          name: demoData.name,
          email: demoEmail,
          password: 'password123',
          role: targetRole,
          phone: demoData.phone,
          address: demoData.address,
        });
      }
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    }

    if (!userEmailOrPhone || !password) {
      return res.status(400).json({ message: 'Please provide both Email/Phone and Password' });
    }

    // Search user by email OR phone number
    let user = await User.findOne({
      $or: [
        { email: userEmailOrPhone.toLowerCase() },
        { phone: userEmailOrPhone },
      ],
    }).select('+password');

    // Auto-create demo user if not in MongoDB yet
    if (!user && demoAccounts[userEmailOrPhone.toLowerCase()]) {
      const demoData = demoAccounts[userEmailOrPhone.toLowerCase()];
      user = await User.create({
        name: demoData.name,
        email: userEmailOrPhone.toLowerCase(),
        password: password || 'password123',
        role: demoData.role,
        phone: demoData.phone,
        address: demoData.address,
      });
    }

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email/phone or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Admin only in production)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Customer',
      phone: phone || '',
      address: address || '',
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        status: user.status,
        avatar: user.avatar,
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

// @desc    Seed initial demo users for Admin, Agent, and Customer
// @route   POST /api/auth/seed
// @access  Public (Demo setup)
export const seedUsers = async (req, res) => {
  try {
    const demoUsers = [
      {
        name: 'System Administrator',
        email: 'admin@microfinance.com',
        password: 'password123',
        role: 'Admin',
        phone: '+1 (555) 019-2831',
        address: 'HQ Financial District, Suite 500',
      },
      {
        name: 'John Field Agent',
        email: 'agent@microfinance.com',
        password: 'password123',
        role: 'Agent',
        phone: '+1 (555) 014-9922',
        address: 'Branch 04 - Sector B',
      },
      {
        name: 'Sarah Customer',
        email: 'customer@microfinance.com',
        password: 'password123',
        role: 'Customer',
        phone: '+1 (555) 018-3344',
        address: '42 Main St, Greenfield',
      },
    ];

    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
      }
    }

    return res.json({ message: 'Demo users seeded successfully (Admin, Agent, Customer)', users: ['admin@microfinance.com', 'agent@microfinance.com', 'customer@microfinance.com'] });
  } catch (error) {
    return res.status(500).json({ message: 'Error seeding users', error: error.message });
  }
};
