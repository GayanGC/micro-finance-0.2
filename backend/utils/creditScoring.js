/**
 * Credit Scoring Engine
 * Evaluates borrower risk based on income/expense ratios,
 * loan history, KYC status, and blacklist flags.
 * Returns a score (0–850) and a risk tag.
 */

/**
 * Compute credit score for a customer
 * @param {Object} customer - Mongoose Customer document
 * @param {Array} existingLoans - Array of Loan documents for this customer
 * @returns {{ score: number, riskTag: string, breakdown: Object }}
 */
export const computeCreditScore = (customer, existingLoans = []) => {
  let score = 500; // Baseline score
  const breakdown = {};

  // === 1. Blacklist Penalty ===
  if (customer.isBlacklisted) {
    score -= 300;
    breakdown.blacklistPenalty = -300;
  } else {
    breakdown.blacklistPenalty = 0;
  }

  // === 2. KYC Status Bonus ===
  if (customer.kycStatus === 'Verified') {
    score += 80;
    breakdown.kycBonus = 80;
  } else if (customer.kycStatus === 'Pending') {
    score -= 20;
    breakdown.kycBonus = -20;
  } else {
    score -= 50; // Rejected
    breakdown.kycBonus = -50;
  }

  // === 3. Income-to-Expense Ratio ===
  const income = Number(customer.monthlyIncome) || 0;
  const expenses = Number(customer.monthlyExpenses) || 0;

  if (income > 0) {
    const ratio = (income - expenses) / income; // Disposable income ratio
    if (ratio >= 0.5) {
      score += 100;
      breakdown.incomeRatio = 100;
    } else if (ratio >= 0.3) {
      score += 60;
      breakdown.incomeRatio = 60;
    } else if (ratio >= 0.1) {
      score += 20;
      breakdown.incomeRatio = 20;
    } else {
      score -= 40;
      breakdown.incomeRatio = -40;
    }
  } else {
    score -= 30;
    breakdown.incomeRatio = -30; // No income declared
  }

  // === 4. Loan History Analysis ===
  const completedLoans = existingLoans.filter((l) => l.status === 'Completed');
  const defaultedLoans = existingLoans.filter((l) => l.status === 'Defaulted');
  const activeLoans = existingLoans.filter((l) => l.status === 'Active');

  score += completedLoans.length * 40; // Good repayment history
  score -= defaultedLoans.length * 120; // Defaults are heavily penalised
  score -= activeLoans.length * 15; // Existing debt load

  breakdown.completedLoansBonus = completedLoans.length * 40;
  breakdown.defaultedLoansPenalty = -(defaultedLoans.length * 120);
  breakdown.activeLoansDeduct = -(activeLoans.length * 15);

  // === 5. CRIB Category Adjustment ===
  const cribBonusMap = { A: 70, B: 30, C: -30, D: -100 };
  const cribBonus = cribBonusMap[customer.cribCategory] || 0;
  score += cribBonus;
  breakdown.cribCategoryBonus = cribBonus;

  // === 6. Customer Account Age ===
  if (customer.createdAt) {
    const ageMonths = Math.floor(
      (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (ageMonths >= 24) {
      score += 30;
      breakdown.accountAgeBonus = 30;
    } else if (ageMonths >= 12) {
      score += 15;
      breakdown.accountAgeBonus = 15;
    } else {
      breakdown.accountAgeBonus = 0;
    }
  }

  // Clamp to [0, 850]
  score = Math.max(0, Math.min(850, Math.round(score)));

  // === Determine Risk Tag ===
  let riskTag;
  if (score >= 700) riskTag = 'Low';
  else if (score >= 500) riskTag = 'Medium';
  else if (score >= 300) riskTag = 'High';
  else riskTag = 'Very High';

  return { score, riskTag, breakdown };
};

/**
 * Determine CRIB category from credit score
 * A = best (700+), B = medium (500-699), C = risky (300-499), D = critical (<300)
 */
export const scoreToCribCategory = (score) => {
  if (score >= 700) return 'A';
  if (score >= 500) return 'B';
  if (score >= 300) return 'C';
  return 'D';
};
