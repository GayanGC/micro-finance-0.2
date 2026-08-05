import express from 'express';
import {
  createAccount,
  getAccounts,
  createJournalEntry,
  getJournalEntries,
  createManualEntry,
} from '../controllers/accountingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

const staffRoles = ['Admin', 'Agent', 'super_admin', 'auditor', 'credit_officer', 'SUPER_ADMIN'];
const managerRoles = ['Admin', 'super_admin', 'credit_officer', 'SUPER_ADMIN'];

// Chart of Accounts
router.get('/accounts', protect, authorize(...staffRoles), getAccounts);
router.post('/accounts', protect, authorize(...managerRoles), auditLog('CREATE', 'Account'), createAccount);

// General Ledger / Journal Entries
router.get('/journal-entries', protect, authorize(...staffRoles), getJournalEntries);
router.post('/journal-entries', protect, authorize(...managerRoles), auditLog('CREATE', 'JournalEntry'), createJournalEntry);
router.post('/manual-entry', protect, authorize(...managerRoles), auditLog('CREATE', 'ManualJournalEntry'), createManualEntry);

export default router;
