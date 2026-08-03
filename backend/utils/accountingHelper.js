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

/**
 * Helper to resolve or create a default account by query
 */
const findOrCreateAccount = async (identifier, defaultSpec, session = null) => {
  const options = session ? { session } : {};

  // 1. Try finding by exact name or number
  let account = await Account.findOne({
    $or: [{ accountName: identifier }, { accountNumber: identifier }],
  }).session(session || null);

  if (account) return account;

  // 2. Try finding by keyword
  account = await Account.findOne({
    accountName: new RegExp(defaultSpec.keyword || identifier, 'i'),
  }).session(session || null);

  if (account) return account;

  // 3. Auto-create standard account if missing
  const newAccountDocs = await Account.create(
    [
      {
        accountNumber: defaultSpec.accountNumber,
        accountName: defaultSpec.accountName,
        accountType: defaultSpec.accountType,
        currentBalance: defaultSpec.initialBalance || 0,
        description: `Auto-generated account for ${defaultSpec.accountName}`,
      },
    ],
    options
  );

  return newAccountDocs[0];
};

/**
 * Automatically posts a balanced double-entry transaction to the General Ledger.
 *
 * @param {Object} params
 * @param {Date} [params.date] - Date of transaction
 * @param {string} params.referenceId - e.g., Loan ID or Receipt number
 * @param {string} params.description - Human-readable memo
 * @param {string} params.debitAccountName - Name or Number of Debit Account
 * @param {string} params.creditAccountName - Name or Number of Credit Account
 * @param {number} params.amount - Positive amount
 * @param {Object} [params.session] - MongoDB Session (if inside transaction)
 * @param {string} [params.createdBy] - User ObjectId
 */
export const postAutomaticJournalEntry = async ({
  date,
  referenceId,
  description,
  debitAccountName = 'Loans Principal Receivable',
  creditAccountName = 'Cash on Hand / Vault',
  amount,
  session = null,
  createdBy = null,
}) => {
  try {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.warn('[AccountingHelper] Invalid amount for journal entry:', amount);
      return null;
    }

    // Account Mapping Fallbacks
    const ACCOUNT_DEFAULTS = {
      'Loans Principal Receivable': { accountNumber: '1100', accountName: 'Loans Principal Receivable', accountType: 'Asset', keyword: 'receivable' },
      'Cash on Hand / Vault': { accountNumber: '1010', accountName: 'Cash on Hand / Vault', accountType: 'Asset', keyword: 'vault|cash' },
      'Bank Operating Account': { accountNumber: '1020', accountName: 'Bank Operating Account', accountType: 'Asset', keyword: 'bank' },
      'Loan Interest Revenue': { accountNumber: '4010', accountName: 'Loan Interest Revenue', accountType: 'Income', keyword: 'interest' },
      'Late Fee & Penalty Revenue': { accountNumber: '4020', accountName: 'Late Fee & Penalty Revenue', accountType: 'Income', keyword: 'penalty|late' },
    };

    const debitDefault = ACCOUNT_DEFAULTS[debitAccountName] || { accountNumber: '1000', accountName: debitAccountName, accountType: 'Asset', keyword: debitAccountName };
    const creditDefault = ACCOUNT_DEFAULTS[creditAccountName] || { accountNumber: '2000', accountName: creditAccountName, accountType: 'Liability', keyword: creditAccountName };

    const debitAcc = await findOrCreateAccount(debitAccountName, debitDefault, session);
    const creditAcc = await findOrCreateAccount(creditAccountName, creditDefault, session);

    if (!debitAcc || !creditAcc) {
      console.error('[AccountingHelper] Unable to resolve debit/credit accounts');
      return null;
    }

    // Update balances in memory
    updateAccountBalance(debitAcc, numAmount, 'DEBIT');
    updateAccountBalance(creditAcc, numAmount, 'CREDIT');

    const options = session ? { session } : {};
    await debitAcc.save(options);
    await creditAcc.save(options);

    // Create journal entry record
    const journalEntries = await JournalEntry.create(
      [
        {
          transactionDate: date ? new Date(date) : new Date(),
          referenceId: referenceId ? String(referenceId) : '',
          description,
          debitAccount: debitAcc._id,
          creditAccount: creditAcc._id,
          amount: numAmount,
          createdBy: createdBy || null,
        },
      ],
      options
    );

    console.log(`[AccountingHelper] ✅ Auto Journal Entry posted: ${description} ($${numAmount})`);
    return journalEntries[0];
  } catch (error) {
    console.error('[AccountingHelper] ❌ Failed to post automatic journal entry:', error.message);
    return null;
  }
};
