import mongoose from 'mongoose';

const collateralSchema = new mongoose.Schema({
  assetType: {
    type: String,
    enum: ['Vehicle', 'Gold', 'Land Deed', 'Property', 'Savings Book', 'Other'],
    default: 'Other',
  },
  description: { type: String, default: '' },
  estimatedValue: { type: Number, default: 0 },
  photoUrl: { type: String, default: '' },
  valuationDate: { type: Date },
}, { _id: false });

const approvalWorkflowSchema = new mongoose.Schema({
  agentApproved: { type: Boolean, default: false },
  agentApprovedAt: { type: Date },
  agentApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  creditOfficerApproved: { type: Boolean, default: false },
  creditOfficerApprovedAt: { type: Date },
  creditOfficerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  branchManagerApproved: { type: Boolean, default: false },
  branchManagerApprovedAt: { type: Date },
  branchManagerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  currentStage: {
    type: String,
    enum: ['agent_review', 'credit_officer_review', 'branch_manager_review', 'fully_approved', 'rejected'],
    default: 'agent_review',
  },
  rejectionReason: { type: String, default: '' },
}, { _id: false });

const scheduleItemSchema = new mongoose.Schema({
  installmentNo: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  expectedInstallment: { type: Number, required: true },
  principalComponent: { type: Number, required: true },
  interestComponent: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending',
  },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: Date },
}, { _id: false });

const loanSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: [true, 'Loan policy is required'],
    },
    principalAmount: {
      type: Number,
      required: [true, 'Principal amount is required'],
      min: 1,
    },
    totalInterest: {
      type: Number,
      required: [true, 'Total interest is required'],
      min: 0,
    },
    totalPayable: {
      type: Number,
      required: [true, 'Total payable amount is required'],
      min: 1,
    },
    monthlyInstallment: {
      type: Number,
      required: [true, 'Monthly installment EMI is required'],
      min: 0.01,
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    remainingPrincipal: {
      type: Number,
      default: function () {
        return this.principalAmount || 0;
      },
    },
    repaymentSchedule: [scheduleItemSchema],
    collateralDetails: {
      type: String,
      default: '',
    },
    // === Structured Collateral Tracking ===
    collateral: {
      type: collateralSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Active', 'Completed', 'Defaulted', 'Rejected'],
      default: 'Active',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursedAt: {
      type: Date,
      default: Date.now,
    },

    // === Multi-Level Approval Workflow (Enterprise Mode) ===
    approvalWorkflow: {
      type: approvalWorkflowSchema,
      default: () => ({
        agentApproved: false,
        creditOfficerApproved: false,
        branchManagerApproved: false,
        currentStage: 'agent_review',
      }),
    },

    // === Multi-Guarantor References ===
    guarantorCustomers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    }],

    // === Advanced Interest & Penalty Engine ===
    interestMethod: {
      type: String,
      enum: ['Flat', 'Reducing Balance', 'Amortization'],
      default: 'Flat',
    },
    penaltyRate: {
      type: Number,
      default: 2, // 2% per month default penalty
      min: 0,
    },
    // Grace period in days before penalty is applied
    gracePeriod: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Annual penalty interest rate (%) applied after grace period
    penaltyInterestRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    penaltyAccrued: {
      type: Number,
      default: 0,
    },

    // === PAR (Portfolio at Risk) Classification ===
    parBucket: {
      type: String,
      enum: ['Current', 'PAR30', 'PAR60', 'PAR90', 'PAR90+'],
      default: 'Current',
    },
    overdueDays: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: {
      type: Date,
    },
    nextDueDate: {
      type: Date,
    },

    // === Branch ===
    branch: {
      type: String,
      default: 'HQ',
      trim: true,
    },

    // === System Mode flag ===
    isEnterpriseMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
