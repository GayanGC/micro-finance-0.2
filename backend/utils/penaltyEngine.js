/**
 * Penalty & PAR (Portfolio at Risk) Engine
 * Computes overdue days, late payment penalties, and PAR bucket classification.
 */

import { shiftToWorkingDay } from './dateHelpers.js';

/**
 * Classify PAR bucket based on overdue days
 * @param {number} overdueDays
 * @returns {string} PAR bucket label
 */
export const classifyPAR = (overdueDays) => {
  if (overdueDays <= 0) return 'Current';
  if (overdueDays <= 30) return 'PAR30';
  if (overdueDays <= 60) return 'PAR60';
  if (overdueDays <= 90) return 'PAR90';
  return 'PAR90+';
};

/**
 * Compute penalty for a loan based on overdue days and penalty rate
 * @param {Object} loan - Mongoose Loan document
 * @param {Date} [paymentDate] - Date of payment (defaults to now)
 * @returns {{ overdueDays: number, penaltyAmount: number, parBucket: string, dailyPenaltyRate: number }}
 */
export const computePenalty = (loan, paymentDate = new Date()) => {
  const lastPayment = loan.lastPaymentDate ? new Date(loan.lastPaymentDate) : new Date(loan.disbursedAt);
  const nextDue = loan.nextDueDate ? new Date(loan.nextDueDate) : null;

  let overdueDays = 0;

  if (nextDue && paymentDate > nextDue) {
    const diffMs = paymentDate.getTime() - nextDue.getTime();
    overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Daily penalty rate = annual penalty rate / 365
  const annualPenaltyRate = Number(loan.penaltyRate) || 2; // Default 2% per month
  const monthlyPenaltyRate = annualPenaltyRate / 100;
  const dailyPenaltyRate = monthlyPenaltyRate / 30;

  // Penalty computed on remaining balance
  const penaltyAmount =
    overdueDays > 0
      ? Math.round(loan.remainingBalance * dailyPenaltyRate * overdueDays * 100) / 100
      : 0;

  const parBucket = classifyPAR(overdueDays);

  return {
    overdueDays,
    penaltyAmount,
    parBucket,
    dailyPenaltyRate: Math.round(dailyPenaltyRate * 1000000) / 1000000,
    monthlyPenaltyRate,
  };
};

/**
 * Generate full amortization schedule for a loan, with holiday-aware due date shifting.
 * @param {number} principal
 * @param {number} annualRate - Annual interest rate %
 * @param {number} durationMonths
 * @param {string} interestMethod - 'Flat' | 'Reducing Balance' | 'Amortization'
 * @param {Date} startDate
 * @param {Array} [holidays=[]] - Array of Holiday documents for due-date shifting
 * @returns {Array} Array of schedule installments
 */
export const generateAmortizationSchedule = (
  principal,
  annualRate,
  durationMonths,
  interestMethod = 'Flat',
  startDate = new Date(),
  holidays = []
) => {
  const P = Number(principal);
  const rate = Number(annualRate);
  const n = Number(durationMonths);
  const schedule = [];

  if (interestMethod === 'Reducing Balance' || interestMethod === 'Amortization') {
    const r = rate / 100 / 12;
    let emi;

    if (r === 0) {
      emi = P / n;
    } else {
      const powFactor = Math.pow(1 + r, n);
      emi = P * ((r * powFactor) / (powFactor - 1));
    }

    let balance = P;
    for (let month = 1; month <= n; month++) {
      const interestComponent = Math.round(balance * r * 100) / 100;
      const principalComponent = Math.round((emi - interestComponent) * 100) / 100;
      balance = Math.max(0, Math.round((balance - principalComponent) * 100) / 100);

      const rawDueDate = new Date(startDate);
      rawDueDate.setMonth(rawDueDate.getMonth() + month);
      const dueDate = shiftToWorkingDay(rawDueDate, holidays);

      schedule.push({
        installmentNo: month,
        dueDate: dueDate.toISOString().split('T')[0],
        emi: Math.round(emi * 100) / 100,
        principalComponent,
        interestComponent,
        balance,
        status: 'Pending',
        ...(dueDate.getTime() !== rawDueDate.getTime() && {
          originalDueDate: rawDueDate.toISOString().split('T')[0],
          shifted: true,
        }),
      });
    }
  } else {
    // Flat rate
    const totalInterest = P * (rate / 100) * (n / 12);
    const totalPayable = P + totalInterest;
    const emi = Math.round((totalPayable / n) * 100) / 100;
    const monthlyInterest = Math.round((totalInterest / n) * 100) / 100;
    const monthlyPrincipal = Math.round((P / n) * 100) / 100;

    let balance = totalPayable;
    for (let month = 1; month <= n; month++) {
      balance = Math.max(0, Math.round((balance - emi) * 100) / 100);

      const rawDueDate = new Date(startDate);
      rawDueDate.setMonth(rawDueDate.getMonth() + month);
      const dueDate = shiftToWorkingDay(rawDueDate, holidays);

      schedule.push({
        installmentNo: month,
        dueDate: dueDate.toISOString().split('T')[0],
        emi,
        principalComponent: monthlyPrincipal,
        interestComponent: monthlyInterest,
        balance,
        status: 'Pending',
        ...(dueDate.getTime() !== rawDueDate.getTime() && {
          originalDueDate: rawDueDate.toISOString().split('T')[0],
          shifted: true,
        }),
      });
    }
  }

  return schedule;
};
