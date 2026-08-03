/**
 * dateHelpers.js
 * Utility functions for holiday-aware date shifting.
 *
 * The core helper `shiftToWorkingDay` accepts a raw Date and the full set
 * of registered Holiday documents, then advances the date day-by-day until
 * it lands on a non-holiday, non-weekend day.
 */

/**
 * Check whether a given Date string/object is present in the holidayDates Set.
 * Comparison is done on the ISO date-only string (YYYY-MM-DD) in UTC.
 *
 * @param {Date} date
 * @param {Set<string>} holidayDateStrings - Set of 'YYYY-MM-DD' strings
 * @returns {boolean}
 */
const isHoliday = (date, holidayDateStrings) => {
  const key = date.toISOString().split('T')[0];
  return holidayDateStrings.has(key);
};

/**
 * Advance a date forward (day by day) until it is neither a holiday
 * nor falls on a weekend (Saturday = 6, Sunday = 0).
 *
 * @param {Date} rawDate - The originally computed due date
 * @param {Array<{date: Date}>} holidays - Array of Holiday documents from DB
 * @param {boolean} [skipWeekends=false] - If true, also skip Sat/Sun
 * @returns {Date} The adjusted working day date
 */
export const shiftToWorkingDay = (rawDate, holidays = [], skipWeekends = false) => {
  // Build a fast lookup Set of 'YYYY-MM-DD' strings
  const holidaySet = new Set(
    holidays.map((h) => {
      const d = new Date(h.date);
      return d.toISOString().split('T')[0];
    })
  );

  let candidate = new Date(rawDate);
  // Cap recursion at 30 days to prevent infinite loops on bad data
  const MAX_SHIFT = 30;
  let shifts = 0;

  while (shifts < MAX_SHIFT) {
    const dayOfWeek = candidate.getUTCDay(); // 0=Sun, 6=Sat
    const onWeekend = skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6);

    if (!isHoliday(candidate, holidaySet) && !onWeekend) {
      break; // Found a valid working day
    }

    // Advance by one day
    candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
    shifts++;
  }

  return candidate;
};

/**
 * Convenience async wrapper that fetches holidays from the DB and shifts
 * the given date. Import and call this wherever due dates are calculated.
 *
 * @param {Date} rawDate
 * @param {boolean} [skipWeekends=false]
 * @returns {Promise<Date>}
 */
export const shiftDueDateAsync = async (rawDate, skipWeekends = false) => {
  try {
    // Dynamic import to avoid circular deps in utility files
    const Holiday = (await import('../models/Holiday.js')).default;
    const holidays = await Holiday.find({}).lean();
    return shiftToWorkingDay(rawDate, holidays, skipWeekends);
  } catch (err) {
    console.error('[dateHelpers] Failed to fetch holidays, returning raw date:', err.message);
    return rawDate; // Graceful fallback — never break the flow
  }
};
