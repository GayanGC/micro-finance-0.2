import Employee from '../models/Employee.js';
import User from '../models/User.js';

// @desc    Register a new Employee
// @route   POST /api/employees
// @access  Private (Admin only)
export const registerEmployee = async (req, res) => {
  try {
    const { fullName, email, phone, role, basicSalary, department } = req.body;

    if (!fullName || !email || !phone || !basicSalary) {
      return res.status(400).json({ message: 'Please fill in all required employee fields.' });
    }

    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: 'An employee with this email already exists.' });
    }

    const employee = await Employee.create({
      fullName,
      email,
      phone,
      role: role || 'Agent',
      basicSalary,
      department: department || 'Field Operations',
    });

    // Also auto-provision user access account for system login
    const userExists = await User.findOne({ email });
    if (!userExists) {
      await User.create({
        name: fullName,
        email,
        password: 'password123', // Default temporary password
        role: role || 'Agent',
        phone,
      });
    }

    return res.status(201).json({
      message: 'Employee registered successfully!',
      employee,
    });
  } catch (error) {
    console.error('Error registering employee:', error);
    return res.status(500).json({ message: 'Failed to register employee', error: error.message });
  }
};

// @desc    Get all Employees
// @route   GET /api/employees
// @access  Private (Admin only)
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving employees' });
  }
};
