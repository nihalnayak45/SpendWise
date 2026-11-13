import type { CategoryName } from '../types/budget';

export const BASE_CATEGORIES: {
  name: CategoryName;
  iconName: string;
  minRange: number;
  maxRange: number;
  color: string;
  defaultPlanned: number;
}[] = [
  { name: 'Food', iconName: 'Utensils', minRange: 1000, maxRange: 8000, color: '#0d9488', defaultPlanned: 4000 },
  { name: 'Transport', iconName: 'Bus', minRange: 500, maxRange: 4000, color: '#3b82f6', defaultPlanned: 1500 },
  { name: 'Shopping', iconName: 'ShoppingBag', minRange: 500, maxRange: 5000, color: '#f59e0b', defaultPlanned: 1500 },
  { name: 'Entertainment', iconName: 'Film', minRange: 300, maxRange: 3000, color: '#8b5cf6', defaultPlanned: 1000 },
  { name: 'Bills', iconName: 'Receipt', minRange: 1000, maxRange: 5000, color: '#64748b', defaultPlanned: 2000 },
  { name: 'Education', iconName: 'GraduationCap', minRange: 500, maxRange: 4000, color: '#06b6d4', defaultPlanned: 1000 },
  { name: 'Savings', iconName: 'PiggyBank', minRange: 1000, maxRange: 10000, color: '#10b981', defaultPlanned: 4000 },
];

export const getFirstDayOfMonth = (d = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Normalizes any date string or Date object to the first day of that month (YYYY-MM-01).
 * Safe against timezone shifts when parsing YYYY-MM or YYYY-MM-DD strings.
 */
export const normalizeToFirstDayOfMonth = (input?: string | Date | null): string => {
  if (!input) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-01`;
    }
  }
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

/**
 * Formats a date string or Date object to YYYY-MM-DD for the expenses table.
 */
export const formatExpenseDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.toLowerCase().includes('today')) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  } else if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
    return `${dateStr.getFullYear()}-${String(dateStr.getMonth() + 1).padStart(2, '0')}-${String(dateStr.getDate()).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Validates that a month string strictly adheres to the schema check: EXTRACT(day from month) = 1
 */
export const isValidFirstDayOfMonth = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-01$/.test(dateStr);
};

export const parseTargetDateToDate = (str: string): string | null => {
  if (!str) return null;
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  const match = trimmed.match(/([a-zA-Z]+)\s+(\d{4})/);
  if (match) {
    const months = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];
    const monthIdx = months.indexOf(match[1].toLowerCase());
    if (monthIdx !== -1) {
      return `${match[2]}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    }
  }
  return null;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Formats a YYYY-MM-DD or YYYY-MM string into a user-friendly display string (e.g. "15 January 2027" or "January 2027")
 * completely free of browser timezone drift.
 */
export const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'TBD';
  const trimmed = dateStr.trim();

  // If already free-form text like "December 2026", return as is
  if (!/^\d{4}-\d{2}/.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split('-');
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || parts[1];

  if (parts.length >= 3) {
    const day = parseInt(parts[2], 10);
    // If day is 1 and was chosen as a monthly convention, show "Month Year" unless specifically requested
    if (day === 1 && trimmed.endsWith('-01')) {
      return `${monthName} ${year}`;
    }
    return `${day} ${monthName} ${year}`;
  }

  return `${monthName} ${year}`;
};

/**
 * Calculates new target date (YYYY-MM-01) from remaining amount and monthly contribution.
 */
export const calculateNewTargetDate = (
  remainingAmount: number,
  monthlyContribution: number
): string => {
  const validRemaining = Math.max(0, remainingAmount);
  const validContrib = Math.max(1, monthlyContribution);
  const monthsNeeded = Math.ceil(validRemaining / validContrib);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0..11

  const targetTotalMonths = currentMonthIdx + monthsNeeded;
  const targetYear = currentYear + Math.floor(targetTotalMonths / 12);
  const targetMonth = (targetTotalMonths % 12) + 1;

  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
};

/**
 * Evaluates goal status based on target amount, saved contributions, and target date.
 */
export const getGoalStatus = (
  targetAmount: number,
  savedAmount: number,
  targetDate?: string | null
): 'Completed' | 'In Progress' | 'Overdue' => {
  if (savedAmount >= targetAmount && targetAmount > 0) {
    return 'Completed';
  }

  if (targetDate) {
    const parsed = parseTargetDateToDate(targetDate);
    if (parsed) {
      const todayStr = formatExpenseDate();
      if (parsed < todayStr) {
        return 'Overdue';
      }
    }
  }

  return 'In Progress';
};
