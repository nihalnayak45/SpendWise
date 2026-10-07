import React, { createContext, useContext, useState, useMemo } from 'react';
import type {
  Expense,
  CategoryAllocation,
  CategoryName,
  FuturePurchase,
  SavingsGoal,
  ToastMessage,
  AccessibilitySettings,
  PageId,
  SimulationScenario,
} from '../types/budget';

interface BudgetContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  monthlyBudget: number;
  setMonthlyBudget: (amount: number) => void;
  expenses: Expense[];
  categoryAllocations: CategoryAllocation[];
  totalSpent: number;
  totalRemaining: number;
  totalAllocated: number;
  unallocatedAmount: number;
  currentSavings: number;
  budgetHealthScore: number;
  budgetHealthChecklist: { text: string; status: 'ok' | 'warning' | 'error' }[];

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  updateCategoryPlanned: (categoryName: CategoryName, newAmount: number) => void;
  resetBudgetAllocations: () => void;
  saveBudgetAllocations: () => void;

  futurePurchases: FuturePurchase[];
  addFuturePurchase: (purchase: { title: string; cost: number; targetDate: string; priority: 'High' | 'Medium' | 'Low' }) => void;
  savingsGoals: SavingsGoal[];
  updateGoalContribution: (goalId: string, monthlyContrib: number) => void;

  simulation: {
    active: boolean;
    scenario: SimulationScenario | null;
    simulatedBudget: number;
    simulatedSavings: number;
    simulatedHealthScore: number;
    simulatedGoalDate: string;
    impactMessage: string;
    isOverBudget: boolean;
  };
  setSimulationAmount: (amount: number) => void;
  setSimulationType: (type: SimulationScenario['type']) => void;
  applySimulation: () => void;
  resetSimulation: () => void;

  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  isAddExpenseModalOpen: boolean;
  setIsAddExpenseModalOpen: (open: boolean) => void;
  isAddPurchaseModalOpen: boolean;
  setIsAddPurchaseModalOpen: (open: boolean) => void;
  editingExpense: Expense | null;
  setEditingExpense: (expense: Expense | null) => void;

  accessibility: AccessibilitySettings;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
}

const DEFAULT_CATEGORIES: CategoryAllocation[] = [
  { name: 'Food', planned: 4000, spent: 3650, iconName: 'Utensils', minRange: 1000, maxRange: 8000, color: '#0d9488' },
  { name: 'Transport', planned: 1500, spent: 1200, iconName: 'Bus', minRange: 500, maxRange: 4000, color: '#3b82f6' },
  { name: 'Shopping', planned: 1500, spent: 1900, iconName: 'ShoppingBag', minRange: 500, maxRange: 5000, color: '#f59e0b' },
  { name: 'Entertainment', planned: 1000, spent: 300, iconName: 'Film', minRange: 300, maxRange: 3000, color: '#8b5cf6' },
  { name: 'Bills', planned: 2000, spent: 0, iconName: 'Receipt', minRange: 1000, maxRange: 5000, color: '#64748b' },
  { name: 'Education', planned: 1000, spent: 450, iconName: 'GraduationCap', minRange: 500, maxRange: 4000, color: '#06b6d4' },
  { name: 'Savings', planned: 4000, spent: 0, iconName: 'PiggyBank', minRange: 1000, maxRange: 10000, color: '#10b981' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', date: '25 Aug', description: 'Swiggy Food Delivery', category: 'Food', amount: 350 },
  { id: 'exp-2', date: '25 Aug', description: 'Uber ride to Campus', category: 'Transport', amount: 220 },
  { id: 'exp-3', date: '24 Aug', description: 'College Canteen Lunch', category: 'Food', amount: 250 },
  { id: 'exp-4', date: '24 Aug', description: 'Bus Pass Monthly Topup', category: 'Transport', amount: 180 },
  { id: 'exp-5', date: '23 Aug', description: 'Amazon Apparel Order', category: 'Shopping', amount: 1200 },
  { id: 'exp-6', date: '23 Aug', description: 'Movie Ticket & Snacks', category: 'Entertainment', amount: 300 },
  { id: 'exp-7', date: '22 Aug', description: 'Course Reference Textbook', category: 'Education', amount: 450 },
  { id: 'exp-8', date: '21 Aug', description: 'Grocery Store Essentials', category: 'Food', amount: 800 },
  { id: 'exp-9', date: '20 Aug', description: 'Headphones Adapter', category: 'Shopping', amount: 700 },
  { id: 'exp-10', date: '19 Aug', description: 'Coffee with Study Group', category: 'Food', amount: 150 },
];

const INITIAL_PURCHASES: FuturePurchase[] = [
  {
    id: 'pur-1',
    title: 'Laptop for Coding',
    cost: 60000,
    saved: 27000,
    targetDate: 'December 2026',
    targetMonthIndex: 11,
    priority: 'High',
    monthlyContribution: 5000,
    icon: 'Laptop',
  },
  {
    id: 'pur-2',
    title: 'Semester Break Trip',
    cost: 10000,
    saved: 7000,
    targetDate: 'November 2026',
    targetMonthIndex: 10,
    priority: 'Medium',
    monthlyContribution: 2000,
    icon: 'Plane',
  },
  {
    id: 'pur-3',
    title: 'Noise Cancelling Headphones',
    cost: 5000,
    saved: 3000,
    targetDate: 'October 2026',
    targetMonthIndex: 9,
    priority: 'Low',
    monthlyContribution: 1000,
    icon: 'Headphones',
  },
];

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(15000);
  const [categoryAllocations, setCategoryAllocations] = useState<CategoryAllocation[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [futurePurchases, setFuturePurchases] = useState<FuturePurchase[]>(INITIAL_PURCHASES);

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 'normal',
    colorblindMode: false,
    reducedMotion: false,
  });

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  const computedCategoryAllocations = useMemo(() => {
    return categoryAllocations.map((cat) => {
      if (cat.name === 'Savings') return cat;
      const spentForCat = expenses
        .filter((exp) => exp.category.toLowerCase() === cat.name.toLowerCase())
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { ...cat, spent: spentForCat };
    });
  }, [categoryAllocations, expenses]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const totalRemaining = monthlyBudget - totalSpent;

  const totalAllocated = useMemo(() => {
    return categoryAllocations.reduce((sum, cat) => sum + cat.planned, 0);
  }, [categoryAllocations]);

  const unallocatedAmount = monthlyBudget - totalAllocated;

  const currentSavings = useMemo(() => {
    const savingsCat = categoryAllocations.find((c) => c.name === 'Savings');
    return savingsCat ? savingsCat.planned : 4000;
  }, [categoryAllocations]);

  const { budgetHealthScore, budgetHealthChecklist } = useMemo(() => {
    let score = 100;
    const checklist: { text: string; status: 'ok' | 'warning' | 'error' }[] = [];

    if (totalSpent > monthlyBudget) {
      score -= 30;
      checklist.push({ text: `Total spending exceeds budget by ₹${totalSpent - monthlyBudget}`, status: 'error' });
    } else {
      checklist.push({ text: 'Spending within monthly budget', status: 'ok' });
    }

    if (currentSavings >= 3000) {
      checklist.push({ text: 'Savings goal on track', status: 'ok' });
    } else {
      score -= 15;
      checklist.push({ text: 'Savings contribution below target', status: 'warning' });
    }

    const foodCat = computedCategoryAllocations.find((c) => c.name === 'Food');
    if (foodCat && foodCat.spent > foodCat.planned) {
      score -= 10;
      checklist.push({ text: 'Food spending slightly higher than planned', status: 'warning' });
    }

    const shoppingCat = computedCategoryAllocations.find((c) => c.name === 'Shopping');
    if (shoppingCat && shoppingCat.spent > shoppingCat.planned) {
      score -= 8;
      checklist.push({ text: 'Shopping allocation exceeded', status: 'warning' });
    }

    if (totalAllocated > monthlyBudget) {
      score -= 15;
      checklist.push({ text: `Planned allocations exceed budget by ₹${totalAllocated - monthlyBudget}`, status: 'error' });
    }

    return {
      budgetHealthScore: Math.max(20, Math.min(100, score)),
      budgetHealthChecklist: checklist,
    };
  }, [totalSpent, monthlyBudget, currentSavings, computedCategoryAllocations, totalAllocated]);

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    const newExp: Expense = { ...expenseData, id: newId };
    setExpenses((prev) => [newExp, ...prev]);
    addToast('success', 'Expense Added', `Added ₹${newExp.amount} for ${newExp.description}`);
  };

  const editExpense = (id: string, expenseData: Omit<Expense, 'id'>) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...expenseData, id } : item)));
    addToast('info', 'Expense Updated', `Updated details for ${expenseData.description}`);
  };

  const deleteExpense = (id: string) => {
    const item = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    addToast('warning', 'Expense Deleted', `Removed ${item?.description || 'expense'}`);
  };

  const updateCategoryPlanned = (categoryName: CategoryName, newAmount: number) => {
    setCategoryAllocations((prev) =>
      prev.map((cat) => (cat.name === categoryName ? { ...cat, planned: newAmount } : cat))
    );
  };

  const resetBudgetAllocations = () => {
    setCategoryAllocations(DEFAULT_CATEGORIES);
    addToast('info', 'Budget Reset', 'Allocations restored to recommended default.');
  };

  const saveBudgetAllocations = () => {
    addToast('success', 'Budget Saved', 'Your new monthly budget plan has been saved.');
  };

  const addFuturePurchase = (data: { title: string; cost: number; targetDate: string; priority: 'High' | 'Medium' | 'Low' }) => {
    const newId = `pur-${Date.now()}`;
    const newPurchase: FuturePurchase = {
      id: newId,
      title: data.title,
      cost: data.cost,
      saved: 0,
      targetDate: data.targetDate,
      targetMonthIndex: 11,
      priority: data.priority,
      monthlyContribution: Math.round(data.cost / 6),
      icon: 'Tag',
    };
    setFuturePurchases((prev) => [...prev, newPurchase]);
    addToast('success', 'Goal Added', `Created target for ${data.title}`);
  };

  const savingsGoals: SavingsGoal[] = useMemo(() => {
    return futurePurchases.map((p) => ({
      id: p.id,
      title: p.title,
      currentAmount: p.saved,
      targetAmount: p.cost,
      targetDate: p.targetDate,
      monthlyContribution: p.monthlyContribution,
      icon: p.icon,
    }));
  }, [futurePurchases]);

  const updateGoalContribution = (goalId: string, monthlyContrib: number) => {
    setFuturePurchases((prev) =>
      prev.map((p) => {
        if (p.id !== goalId) return p;
        const remaining = p.cost - p.saved;
        const monthsNeeded = Math.ceil(remaining / Math.max(100, monthlyContrib));
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const targetMIndex = (8 + monthsNeeded) % 12;
        const year = 2026 + Math.floor((8 + monthsNeeded) / 12);
        const newTargetDate = `${months[targetMIndex]} ${year}`;

        return {
          ...p,
          monthlyContribution: monthlyContrib,
          targetDate: newTargetDate,
        };
      })
    );
  };

  const [simScenario, setSimScenario] = useState<SimulationScenario>({
    id: 'sim-1',
    name: 'Buy something new',
    type: 'buy',
    amount: 5000,
    description: 'What if I spend ₹5,000 on a new purchase?',
  });

  const [isSimActive, setIsSimActive] = useState<boolean>(false);

  const setSimulationAmount = (amount: number) => {
    setIsSimActive(true);
    setSimScenario((prev) => ({ ...prev, amount }));
  };

  const setSimulationType = (type: SimulationScenario['type']) => {
    setIsSimActive(true);
    let name = 'Buy something new';
    let desc = 'Simulating an unexpected purchase';
    if (type === 'increase_spend') {
      name = 'Increase monthly spending';
      desc = 'What if dining out & shopping expenses rise?';
    } else if (type === 'decrease_spend') {
      name = 'Cut down expenses';
      desc = 'What if I reduce discretionary spending?';
    } else if (type === 'increase_savings') {
      name = 'Boost monthly savings';
      desc = 'What if I save extra every month?';
    } else if (type === 'change_goal_date') {
      name = 'Accelerate purchase goal';
      desc = 'What if I put extra savings towards laptop?';
    }

    setSimScenario((prev) => ({ ...prev, type, name, description: desc }));
  };

  const simulation = useMemo(() => {
    let simulatedBudget = monthlyBudget;
    let simulatedSavings = currentSavings;
    let simulatedHealthScore = budgetHealthScore;
    let simulatedGoalDate = 'December 2026';
    let impactMessage = 'No significant impact on your timeline.';
    let isOverBudget = false;

    if (simScenario.type === 'buy') {
      const cost = simScenario.amount;
      simulatedSavings = Math.max(0, currentSavings - Math.min(cost, currentSavings));

      if (cost > totalRemaining) {
        isOverBudget = true;
        simulatedHealthScore = Math.max(25, budgetHealthScore - 28);
        simulatedGoalDate = 'February 2027';
        impactMessage = `⚠ Spending ₹${cost.toLocaleString('en-IN')} will delay your Laptop goal by 2 months and consume your emergency reserve!`;
      } else {
        simulatedHealthScore = Math.max(40, budgetHealthScore - 15);
        simulatedGoalDate = 'January 2027';
        impactMessage = `⚠ Your laptop goal date will shift from December to January.`;
      }
    } else if (simScenario.type === 'increase_spend') {
      const extra = simScenario.amount;
      simulatedBudget = monthlyBudget + extra;
      simulatedHealthScore = Math.max(30, budgetHealthScore - 20);
      impactMessage = `⚠ Increasing monthly expenses by ₹${extra.toLocaleString('en-IN')} reduces available savings potential by ${Math.round((extra / monthlyBudget) * 100)}%.`;
    } else if (simScenario.type === 'decrease_spend') {
      const cut = simScenario.amount;
      simulatedSavings = currentSavings + cut;
      simulatedHealthScore = Math.min(98, budgetHealthScore + 12);
      simulatedGoalDate = 'October 2026';
      impactMessage = `🎉 Saving an extra ₹${cut.toLocaleString('en-IN')} monthly accelerates your Laptop target by 2 months!`;
    } else if (simScenario.type === 'increase_savings') {
      const boost = simScenario.amount;
      simulatedSavings = currentSavings + boost;
      simulatedHealthScore = Math.min(100, budgetHealthScore + 15);
      simulatedGoalDate = 'November 2026';
      impactMessage = `💪 Boosted savings track improves financial stability and speeds up goals.`;
    }

    return {
      active: isSimActive,
      scenario: simScenario,
      simulatedBudget,
      simulatedSavings,
      simulatedHealthScore,
      simulatedGoalDate,
      impactMessage,
      isOverBudget,
    };
  }, [simScenario, isSimActive, monthlyBudget, currentSavings, budgetHealthScore, totalRemaining]);

  const applySimulation = () => {
    if (simScenario.type === 'buy') {
      addExpense({
        date: '30 Aug',
        description: `Simulated Purchase (${simScenario.name})`,
        category: 'Shopping',
        amount: simScenario.amount,
      });
      addToast('success', 'Plan Applied!', `Added ₹${simScenario.amount} to actual expenses.`);
    } else if (simScenario.type === 'increase_spend') {
      setMonthlyBudget((prev) => prev + simScenario.amount);
      addToast('success', 'Budget Updated', `Increased budget by ₹${simScenario.amount}`);
    } else if (simScenario.type === 'decrease_spend') {
      updateCategoryPlanned('Shopping', Math.max(500, (categoryAllocations.find((c) => c.name === 'Shopping')?.planned || 1500) - simScenario.amount));
      addToast('success', 'Plan Applied', 'Reduced planned shopping expenditure.');
    }
    setIsSimActive(false);
  };

  const resetSimulation = () => {
    setSimScenario({
      id: 'sim-1',
      name: 'Buy something new',
      type: 'buy',
      amount: 5000,
      description: 'What if I spend ₹5,000 on a new purchase?',
    });
    setIsSimActive(false);
    addToast('info', 'Simulation Reset', 'Returned to your actual baseline budget.');
  };

  return (
    <BudgetContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        monthlyBudget,
        setMonthlyBudget,
        expenses,
        categoryAllocations: computedCategoryAllocations,
        totalSpent,
        totalRemaining,
        totalAllocated,
        unallocatedAmount,
        currentSavings,
        budgetHealthScore,
        budgetHealthChecklist,
        addExpense,
        editExpense,
        deleteExpense,
        updateCategoryPlanned,
        resetBudgetAllocations,
        saveBudgetAllocations,
        futurePurchases,
        addFuturePurchase,
        savingsGoals,
        updateGoalContribution,
        simulation,
        setSimulationAmount,
        setSimulationType,
        applySimulation,
        resetSimulation,
        toasts,
        addToast,
        removeToast,
        isAddExpenseModalOpen,
        setIsAddExpenseModalOpen,
        isAddPurchaseModalOpen,
        setIsAddPurchaseModalOpen,
        editingExpense,
        setEditingExpense,
        accessibility,
        updateAccessibility,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
