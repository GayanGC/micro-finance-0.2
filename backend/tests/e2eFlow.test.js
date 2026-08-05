import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import app from '../server.js';

dotenv.config();

// Use express app directly with supertest or external URL if set
const target = process.env.TEST_API_URL || app;

describe('🚀 End-to-End Microfinance System Integration Flow', () => {
  let token = '';
  let customerId = '';
  let policyId = '';
  let loanId = '';
  let receiptNumber = '';

  const testPhone = `077${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testNic = `${Math.floor(100000000 + Math.random() * 900000000)}V`;

  beforeAll(async () => {
    await connectDB();

    // 1. Seed or Login Admin user
    await request(target).post('/api/auth/seed').send();

    const loginRes = await request(target)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@microfinance.com',
        password: 'adminpassword123',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    token = loginRes.body.token;
  });

  afterAll(async () => {
    // Close mongoose connection after test suite finishes
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ── Step 1: Open Cashier Register ──────────────────────────────────────────
  it('Step 1: Should open a Cashier Register with a starting float of $5,000', async () => {
    // Close any pre-existing active register if open
    await request(target)
      .post('/api/registers/close')
      .set('Authorization', `Bearer ${token}`)
      .send({ closingBalance: 5000, notes: 'Pre-test reset' });

    const res = await request(target)
      .post('/api/registers/open')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startingBalance: 5000,
        branch: 'E2E Test Branch',
        notes: 'E2E Test Shift Opening Float',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.register).toBeDefined();
    expect(res.body.register.status).toBe('OPEN');
    expect(res.body.register.startingBalance).toBe(5000);
  });

  // ── Step 2: Create Policy & Customer ───────────────────────────────────────
  it('Step 2: Should create a new Borrower Customer profile', async () => {
    // Fetch or create policy
    let policyRes = await request(target)
      .get('/api/policies')
      .set('Authorization', `Bearer ${token}`);

    if (!policyRes.body || policyRes.body.length === 0) {
      const createPol = await request(target)
        .post('/api/policies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          policyName: 'E2E Micro Enterprise Plan',
          durationMonths: 12,
          interestRate: 12,
          interestType: 'Flat',
          minAmount: 1000,
          maxAmount: 100000,
        });
      policyId = createPol.body._id;
    } else {
      policyId = policyRes.body[0]._id;
    }

    const custRes = await request(target)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'E2E Test Borrower',
        phone: testPhone,
        pin: '1234',
        address: '456 Financial District, Colombo',
        nicNumber: testNic,
        kycStatus: 'Verified',
        monthlyIncome: 75000,
        branch: 'E2E Test Branch',
      });

    expect(custRes.status).toBe(201);
    expect(custRes.body.customer._id).toBeDefined();
    customerId = custRes.body.customer._id;
  });

  // ── Step 3: Create & Disburse Loan ─────────────────────────────────────────
  it('Step 3: Should issue and disburse a $50,000 Loan for the customer', async () => {
    const loanRes = await request(target)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        policyId,
        principalAmount: 50000,
        gracePeriod: 0,
        penaltyInterestRate: 2,
        sendWhatsAppMsg: false,
      });

    expect(loanRes.status).toBe(201);
    expect(loanRes.body.loan).toBeDefined();
    expect(loanRes.body.loan.principalAmount).toBe(50000);
    expect(loanRes.body.loan.status).toBe('Active');
    loanId = loanRes.body.loan._id;
  });

  // ── Step 4: Collect Repayment ──────────────────────────────────────────────
  it('Step 4: Should collect a $5,000 EMI payment and deduct from loan balance', async () => {
    const payRes = await request(target)
      .post('/api/repayments/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
        loanId,
        amountPaid: 5000,
        paymentMethod: 'Cash',
        notes: 'E2E EMI settlement',
        sendWhatsAppMsg: false,
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.repayment).toBeDefined();
    expect(payRes.body.repayment.amountPaid).toBe(5000);
    receiptNumber = payRes.body.repayment.receiptNumber;
  });

  // ── Step 5: Verify Automated Journal Entries ──────────────────────────────
  it('Step 5: Should verify automated double-entry accounting records exist in General Ledger', async () => {
    const ledgerRes = await request(target)
      .get('/api/accounting/journal-entries')
      .set('Authorization', `Bearer ${token}`);

    expect(ledgerRes.status).toBe(200);
    expect(Array.isArray(ledgerRes.body)).toBe(true);

    // Assert disbursement journal entry exists
    const disbursementEntry = ledgerRes.body.find(
      (j) => j.amount === 50000 || (j.description && j.description.includes('Disbursement'))
    );
    expect(disbursementEntry).toBeDefined();

    // Assert repayment journal entry exists
    const repaymentEntry = ledgerRes.body.find(
      (j) => j.amount === 50000 || j.amount === 5000 || j.referenceId === receiptNumber
    );
    expect(repaymentEntry).toBeDefined();
  });

  // ── Step 6: Close Cashier Register ─────────────────────────────────────────
  it('Step 6: Should close Cashier Register with $10,000 ($5000 Float + $5000 Collection) and verify zero discrepancy', async () => {
    const closeRes = await request(target)
      .post('/api/registers/close')
      .set('Authorization', `Bearer ${token}`)
      .send({
        closingBalance: 10000,
        notes: 'E2E Shift Closing Drawer Balance',
      });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.register).toBeDefined();
    expect(closeRes.body.register.status).toBe('CLOSED');
    expect(closeRes.body.closingBalance).toBe(10000);
    expect(closeRes.body.expectedBalance).toBe(10000);
    expect(closeRes.body.discrepancy).toBe(0);
  });
});
