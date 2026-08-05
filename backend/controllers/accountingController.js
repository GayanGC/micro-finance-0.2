import mongoose from 'mongoose';
import Account from '../models/Account.js';
import JournalEntry from '../models/JournalEntry.js';

/**
 * Adjust account balance according to Accounting Rules:
 * Assets & Expenses: Debit (+), Credit (-)
 * Liabilities, Equity, Income: Credit (+), Debit (-)
 */
const updateAccountBalance = (account, amount, direction) => {
  const isDebitIncreaseType = ['Asset', 'Expense'].includes(account.accountType);
  let change = 0;

  if (direction === 'DEBIT') {
    change = isDebitIncreaseType ? amount : -amount;
  } else if (direction === 'CREDIT') {
    change = isDebitIncreaseType ? -amount : amount;
  }

  account.currentBalance = Math.round((account.currentBalance + change) * 100) / 100;
  return account;
};

// @desc    Create a new Ledger Account (Chart of Accounts)
// @route   POST /api/accounting/accounts
// @access  Private (Admin, super_admin, credit_officer)
export const createAccount = async (req, res) => {
  try {
    const { accountName, accountNumber, accountType, branch, initialBalance, description } = req.body;

    if (!accountName || !accountNumber || !accountType) {
      return res.status(400).json({ message: 'Account name, number, and type are required.' });
    }

    const validTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
    if (!validTypes.includes(accountType)) {
      return res.status(400).json({ message: `Account type must be one of: ${validTypes.join(', ')}` });
    }

    const existingAccount = await Account.findOne({ accountNumber: accountNumber.trim() });
    if (existingAccount) {
      return res.status(400).json({ message: `Account number "${accountNumber}" is already in use.` });
    }

    const account = await Account.create({
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      accountType,
      branch: branch ? branch.trim() : '',
      currentBalance: Number(initialBalance || 0),
      description: description ? description.trim() : '',
    });

    return res.status(201).json({ message: 'Account created successfully!', account });
  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({ message: 'Failed to create account', error: error.message });
  }
};

// @desc    Get all accounts in Chart of Accounts (with summary stats)
// @route   GET /api/accounting/accounts
// @access  Private (Admin, Agent, super_admin, auditor, credit_officer)
export const getAccounts = async (req, res) => {
  try {
    const { branch, accountType } = req.query;
    const filter = {};
    if (branch) filter.branch = branch;
    if (accountType) filter.accountType = accountType;

    let accounts = await Account.find(filter).sort({ accountNumber: 1 });

    // Seed default microfinance accounts if Chart of Accounts is completely empty
    if (accounts.length === 0 && !branch && !accountType) {
      const defaultAccounts = [
        { accountNumber: '1010', accountName: 'Cash on Hand / Vault', accountType: 'Asset', currentBalance: 50000 },
        { accountNumber: '1020', accountName: 'Bank Operating Account', accountType: 'Asset', currentBalance: 120000 },
        { accountNumber: '1100', accountName: 'Loans Principal Receivable', accountType: 'Asset', currentBalance: 75000 },
        { accountNumber: '2010', accountName: 'Customer Savings Deposits', accountType: 'Liability', currentBalance: 30000 },
        { accountNumber: '2020', accountName: 'Borrowings / Commercial Loans', accountType: 'Liability', currentBalance: 50000 },
        { accountNumber: '3010', accountName: 'Shareholders Equity Capital', accountType: 'Equity', currentBalance: 150000 },
        { accountNumber: '4010', accountName: 'Loan Interest Revenue', accountType: 'Income', currentBalance: 18500 },
        { accountNumber: '4020', accountName: 'Late Fee & Penalty Revenue', accountType: 'Income', currentBalance: 2400 },
        { accountNumber: '5010', accountName: 'Branch Operating Expenses', accountType: 'Expense', currentBalance: 6100 },
        { accountNumber: '5020', accountName: 'Loan Loss Provision Expense', accountType: 'Expense', currentBalance: 2800 },
      ];
      accounts = await Account.insertMany(defaultAccounts);
    }

    // Compute summary by type
    const summary = {
      Asset: 0,
      Liability: 0,
      Equity: 0,
      Income: 0,
      Expense: 0,
    };

    accounts.forEach((acc) => {
      if (summary[acc.accountType] !== undefined) {
        summary[acc.accountType] += acc.currentBalance || 0;
      }
    });

    Object.keys(summary).forEach((k) => {
      summary[k] = Math.round(summary[k] * 100) / 100;
    });

    return res.json({ accounts, summary });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({ message: 'Failed to fetch Chart of Accounts', error: error.message });
  }
};

// @desc    Create a Double-Entry Journal Entry with MongoDB Transaction
// @route   POST /api/accounting/journal-entries
// @access  Private (Admin, super_admin, credit_officer)
export const createJournalEntry = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { debitAccountId, creditAccountId, amount, description, referenceId, transactionDate } = req.body;

    if (!debitAccountId || !creditAccountId || !amount || !description) {
      return res.status(400).json({ message: 'Please provide debit account, credit account, amount, and description.' });
    }

    if (debitAccountId === creditAccountId) {
      return res.status(400).json({ message: 'Debit and Credit accounts must be different.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    let entryResult = null;

    // Execute with transaction if supported, else fallback to standard update
    const executeLogic = async (sess) => {
      const options = sess ? { session: sess } : {};

      const debitAcc = await Account.findById(debitAccountId).session(sess || null);
      const creditAcc = await Account.findById(creditAccountId).session(sess || null);

      if (!debitAcc) throw new Error('Debit account not found.');
      if (!creditAcc) throw new Error('Credit account not found.');

      // Update balances using proper accounting rules
      updateAccountBalance(debitAcc, numAmount, 'DEBIT');
      updateAccountBalance(creditAcc, numAmount, 'CREDIT');

      await debitAcc.save(options);
      await creditAcc.save(options);

      const entryDocs = await JournalEntry.create(
        [
          {
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
            referenceId: referenceId ? referenceId.trim() : '',
            description: description.trim(),
            debitAccount: debitAcc._id,
            creditAccount: creditAcc._id,
            amount: numAmount,
            createdBy: req.user._id,
          },
        ],
        options
      );

      entryResult = entryDocs[0];
    };

    // Try MongoDB session transaction
    try {
      await session.withTransaction(async () => {
        await executeLogic(session);
      });
    } catch (txError) {
      // Fallback for MongoDB standalone without replica set
      if (txError.message?.includes('Transaction') || txError.message?.includes('replica set')) {
        await executeLogic(null);
      } else {
        throw txError;
      }
    }

    const populatedEntry = await JournalEntry.findById(entryResult._id)
      .populate('debitAccount', 'accountName accountNumber accountType')
      .populate('creditAccount', 'accountName accountNumber accountType')
      .populate('createdBy', 'name role');

    return res.status(201).json({
      message: 'Journal entry posted successfully!',
      journalEntry: populatedEntry,
    });
  } catch (error) {
    console.error('Error posting journal entry:', error);
    return res.status(500).json({ message: 'Failed to post journal entry', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get Journal Entries (General Ledger)
// @route   GET /api/accounting/journal-entries
// @access  Private (Admin, Agent, super_admin, auditor, credit_officer)
export const getJournalEntries = async (req, res) => {
  try {
    const { startDate, endDate, accountId } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (accountId) {
      filter.$or = [{ debitAccount: accountId }, { creditAccount: accountId }];
    }

    const entries = await JournalEntry.find(filter)
      .populate('debitAccount', 'accountName accountNumber accountType')
      .populate('creditAccount', 'accountName accountNumber accountType')
      .populate('createdBy', 'name role')
      .sort({ transactionDate: -1, createdAt: -1 });

    return res.json({ journalEntries, stats });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return res.status(500).json({ message: 'Failed to fetch journal entries', error: error.message });
  }
};

// @desc    Create a Manual Income or Expense Journal Entry
// @route   POST /api/accounting/manual-entry
// @access  Private (Admin, super_admin, SUPER_ADMIN)
export const createManualEntry = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { amount, type, description, accountId, paymentMethod } = req.body;

    if (!amount || Number(amount) <= 0 || !type || !description || !accountId) {
      return res.status(400).json({ message: 'Amount, type (Income or Expense), description, and target account are required.' });
    }

    if (!['Income', 'Expense'].includes(type)) {
      return res.status(400).json({ message: 'Transaction type must be Income or Expense.' });
    }

    const numAmount = Number(amount);
    const targetAccount = await Account.findById(accountId);
    if (!targetAccount) {
      return res.status(404).json({ message: 'Target ledger account not found.' });
    }

    // Resolve cash / bank contra account
    const contraAccName = paymentMethod === 'Bank Transfer' ? 'Bank Operating Account' : 'Cash on Hand / Vault';
    let contraAccount = await Account.findOne({ accountName: contraAccName });

    if (!contraAccount) {
      contraAccount = await Account.findOne({ accountType: 'Asset' });
    }

    let debitAcc, creditAcc;

    if (type === 'Expense') {
      // Debit: Expense Account (increases expense), Credit: Cash/Bank Account (decreases asset)
      debitAcc = targetAccount;
      creditAcc = contraAccount;
    } else {
      // Debit: Cash/Bank Account (increases asset), Credit: Income Account (increases income)
      debitAcc = contraAccount;
      creditAcc = targetAccount;
    }

    let resultEntry;

    await session.withTransaction(async () => {
      // Update balances
      updateAccountBalance(debitAcc, numAmount, 'DEBIT');
      updateAccountBalance(creditAcc, numAmount, 'CREDIT');

      await debitAcc.save({ session });
      await creditAcc.save({ session });

      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `MAN-${type.substring(0, 3).toUpperCase()}-${dateCode}-${randomSuffix}`;

      const [entry] = await JournalEntry.create(
        [
          {
            transactionDate: new Date(),
            referenceId,
            description: `Manual ${type}: ${description}`,
            debitAccount: debitAcc._id,
            creditAccount: creditAcc._id,
            amount: numAmount,
            createdBy: req.user._id,
          },
        ],
        { session }
      );

      resultEntry = entry;
    });

    return res.status(201).json({
      message: `Manual ${type} entry of $${numAmount.toFixed(2)} recorded successfully!`,
      journalEntry: resultEntry,
    });
  } catch (error) {
    console.error('Error recording manual entry:', error);
    return res.status(500).json({ message: 'Failed to record manual entry', error: error.message });
  } finally {
    session.endSession();
  }
};
