export type CategoryName = 'Food' | 'Transport' | 'Shopping' | 'Entertainment' | 'Bills' | 'Education' | 'Savings';

export type Priority = 'High' | 'Medium' | 'Low';

export interface Expense {
  id: string;
  date: string; // e.g. "2026-08-25" or "25 Aug"
  description: string;
  category: CategoryName;
  amount: number;
}

export interface CategoryAllocation {
  name: CategoryName;
  planned: number;
  spent: number;
  iconName: string;
  minRange: number;
  maxRange: number;
  color: string;
}

export interface FuturePurchase {
  id: string;
  title: string;
  cost: number;
  saved: number;
  targetDate: string; // e.g. "December 2026"
  targetMonthIndex: number; // 0..11
  priority: Priority;
  monthlyContribution: number;
  icon: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string; // e.g., "December 2026"
  monthlyContribution: number;
  icon: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  type: 'buy' | 'increase_spend' | 'decrease_spend' | 'increase_savings' | 'change_goal_date';
  amount: number;
  selectedCategory?: CategoryName;
  description: string;
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  category: string;
  impactScore?: string;
  recommendation: string;
  chartData?: { label: string; value: number }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  colorblindMode: boolean;
  reducedMotion: boolean;
}

export type PageId =
  | 'dashboard'
  | 'expenses'
  | 'planner'
  | 'purchases'
  | 'goals'
  | 'simulator'
  | 'insights'
  | 'settings';
