import Policy from '../models/Policy.js';

// @desc    Create a new Loan Policy
// @route   POST /api/policies
// @access  Private (Admin only)
export const createPolicy = async (req, res) => {
  try {
    const { policyName, interestRate, durationMonths, interestType, description } = req.body;

    if (!policyName || interestRate === undefined || !durationMonths) {
      return res.status(400).json({ message: 'Please fill in all policy requirements (Name, Interest Rate, Duration).' });
    }

    const policy = await Policy.create({
      policyName,
      interestRate: Number(interestRate),
      durationMonths: Number(durationMonths),
      interestType: interestType || 'Flat',
      description: description || '',
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: 'Loan policy created successfully!',
      policy,
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    return res.status(500).json({ message: 'Failed to create policy', error: error.message });
  }
};

// @desc    Get all Loan Policies
// @route   GET /api/policies
// @access  Private
export const getPolicies = async (req, res) => {
  try {
    let policies = await Policy.find({ status: 'Active' }).sort({ createdAt: -1 });

    // Auto-seed default policies if none exist
    if (policies.length === 0) {
      const defaultPolicies = [
        {
          policyName: 'Micro Business Starter (12% Flat)',
          interestRate: 12.0,
          durationMonths: 12,
          interestType: 'Flat',
          description: 'Standard 1-year flat interest loan for small retail businesses.',
        },
        {
          policyName: 'Agriculture Growth (14% Reducing Balance)',
          interestRate: 14.0,
          durationMonths: 24,
          interestType: 'Reducing Balance',
          description: '2-year reducing balance loan with lower long-term interest burden.',
        },
        {
          policyName: 'Personal Emergency (10% Flat - 6 Months)',
          interestRate: 10.0,
          durationMonths: 6,
          interestType: 'Flat',
          description: 'Short term 6-month loan for immediate emergency needs.',
        },
      ];
      policies = await Policy.insertMany(defaultPolicies);
    }

    return res.json(policies);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving policies', error: error.message });
  }
};
