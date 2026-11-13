  import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
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
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth, ensureProfileExists } from './AuthContext';
import {
  BASE_CATEGORIES,
  getFirstDayOfMonth,
  normalizeToFirstDayOfMonth,
  formatExpenseDate,
  parseTargetDateToDate,
  calculateNewTargetDate,
  getGoalStatus,
} from '../lib/budgetUtils';

interface BudgetContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthlyBudget: number;
  setMonthlyBudget: (amount: number) => void;
  expenses: Expense[];
  allExpenses: Expense[];
  categoryAllocations: CategoryAllocation[];
  totalSpent: number;
  totalRemaining: number;
  totalAllocated: number;
  unallocatedAmount: number;
  currentSavings: number;
  budgetHealthScore: number;
  budgetHealthChecklist: { text: string; status: 'ok' | 'warning' | 'error' }[];
  isLoadingData: boolean;
  refreshData: () => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  editExpense: (id: string, expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  updateCategoryPlanned: (categoryName: CategoryName, newAmount: number) => void;
  resetBudgetAllocations: () => Promise<void>;
  saveBudgetAllocations: () => Promise<void>;

  futurePurchases: FuturePurchase[];
  addFuturePurchase: (purchase: {
    title: string;
    cost: number;
    targetDate: string;
    priority: 'High' | 'Medium' | 'Low';
    icon?: string;
  }) => Promise<void>;
  recordContribution: (goalId: string, amount: number) => Promise<void>;
  savingsGoals: SavingsGoal[];
  updateGoalContribution: (goalId: string, monthlyContrib: number) => Promise<void>;

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
  applySimulation: () => Promise<void>;
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

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedMonth, setSelectedMonthState] = useState<string>(getFirstDayOfMonth());
  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(normalizeToFirstDayOfMonth(month));
  }, []);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(0);
  const [categoryAllocations, setCategoryAllocations] = useState<CategoryAllocation[]>(
    BASE_CATEGORIES.map(b => ({
      name: b.name,
      planned: 0,
      spent: 0,
      iconName: b.iconName,
      minRange: b.minRange,
      maxRange: b.maxRange,
      color: b.color,
    }))
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [userPlans, setUserPlans] = useState<{ id: string; month: string }[]>([]);
  const [futurePurchases, setFuturePurchases] = useState<FuturePurchase[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

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

  // Helper to ensure a budget plan exists for any month (e.g. for historical or future expenses)
  const getOrCreatePlanForMonth = async (monthDateStr: string): Promise<string | null> => {
    if (!user || !isSupabaseConfigured) return null;
    const normMonth = normalizeToFirstDayOfMonth(monthDateStr);
    const existing = userPlans.find(p => p.month === normMonth);
    if (existing) return existing.id;

    try {
      const { data: newPlan, error } = await supabase
        .from('budget_plan')
        .upsert(
          {
            user_id: user.id,
            month: normMonth,
            total_budget: 15000,
          },
          { onConflict: 'user_id,month' }
        )
        .select('id, month')
        .single();

      if (error || !newPlan) {
        console.error('Error ensuring budget plan for month:', error?.message);
        return null;
      }

      setUserPlans(prev => [...prev.filter(p => p.id !== newPlan.id), { id: newPlan.id, month: newPlan.month }]);
      return newPlan.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Load all user financial data from Supabase for the selected month and all-time history
  const loadUserData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    try {
      // 0. Ensure user profile exists in public.profiles to satisfy budget_plan_user_id_fkey
      await ensureProfileExists(user);

      // 1. Fetch all budget_plans for this user (supports historical multi-month expense tracking)
      const { data: userPlansData, error: plansError } = await supabase
        .from('budget_plan')
        .select('id, user_id, month, total_budget, created_at, updated_at')
        .eq('user_id', user.id);

      if (plansError) {
        console.error('Error fetching budget plans:', plansError.message);
      }

      let userPlansList = (userPlansData || []).map(p => ({ id: p.id, month: p.month }));
      let planId: string | null = null;
      let planTotalBudget = 0;

      const existingPlan = (userPlansData || []).find(p => p.month === selectedMonth);
      if (existingPlan) {
        planId = existingPlan.id;
        planTotalBudget = Number(existingPlan.total_budget || 0);
      } else {
        // Create initial default plan for new user/month using safe conflict handling on (user_id, month)
        const defaultTotal = 15000;
        const { data: newPlan, error: createError } = await supabase
          .from('budget_plan')
          .upsert(
            {
              user_id: user.id,
              month: selectedMonth,
              total_budget: defaultTotal,
            },
            { onConflict: 'user_id,month' }
          )
          .select('id, user_id, month, total_budget, created_at, updated_at')
          .single();

        if (createError) {
          console.error('Error creating initial budget plan:', createError.message);
          addToast('error', 'Budget Plan Error', createError.message);
        } else if (newPlan) {
          planId = newPlan.id;
          planTotalBudget = defaultTotal;
          userPlansList = [...userPlansList.filter(p => p.id !== newPlan.id), { id: newPlan.id, month: newPlan.month }];

          // Insert recommended default category allocations into budget_categories
          const initialCategoryRows = BASE_CATEGORIES.map(c => ({
            budget_plan_id: newPlan.id,
            category: c.name,
            allocated_amount: c.defaultPlanned,
          }));

          const { error: catInsertError } = await supabase
            .from('budget_categories')
            .upsert(initialCategoryRows, { onConflict: 'budget_plan_id,category' });

          if (catInsertError) {
            console.error('Error inserting initial budget categories:', catInsertError.message);
          }

          // Insert default monthly savings plan
          const { error: savingsPlanError } = await supabase
            .from('monthly_savings_plans')
            .upsert(
              {
                user_id: user.id,
                month: selectedMonth,
                planned_amount: 4000,
              },
              { onConflict: 'user_id,month' }
            );

          if (savingsPlanError) {
            console.error('Error creating initial monthly savings plan:', savingsPlanError.message);
          }
        }
      }

      setUserPlans(userPlansList);
      setCurrentPlanId(planId);
      setMonthlyBudgetState(planTotalBudget);

      // 2. Fetch Category Allocations for this budget plan
      if (planId) {
        const { data: categoriesData, error: catFetchError } = await supabase
          .from('budget_categories')
          .select('id, budget_plan_id, category, allocated_amount, created_at')
          .eq('budget_plan_id', planId);

        if (catFetchError) {
          console.error('Error fetching budget categories:', catFetchError.message);
        }

        const categoryMap = new Map<string, number>();
        (categoriesData || []).forEach(c => {
          categoryMap.set(c.category, Number(c.allocated_amount || 0));
        });

        setCategoryAllocations(
          BASE_CATEGORIES.map(b => ({
            name: b.name,
            planned: categoryMap.has(b.name) ? categoryMap.get(b.name)! : 0,
            spent: 0,
            iconName: b.iconName,
            minRange: b.minRange,
            maxRange: b.maxRange,
            color: b.color,
          }))
        );
      }

      // 3. Fetch Historical Expenses across all budget plans belonging to this user
      // Table 4: id, budget_plan_id, category, description, amount, expense_date, created_at
      // STRICT: User isolation enforced by filtering budget_plan_id in authenticated user's plans
      const allUserPlanIds = userPlansList.map(p => p.id);
      if (allUserPlanIds.length > 0) {
        const { data: expensesData, error: expFetchError } = await supabase
          .from('expenses')
          .select('id, budget_plan_id, category, description, amount, expense_date, created_at')
          .in('budget_plan_id', allUserPlanIds)
          .order('expense_date', { ascending: false });

        if (expFetchError) {
          console.error('Error fetching expenses:', expFetchError.message);
          addToast('error', 'Expenses Error', expFetchError.message);
          setAllExpenses([]);
          setExpenses([]);
        } else if (expensesData) {
          const mappedAll: Expense[] = expensesData.map(e => ({
            id: e.id,
            date: e.expense_date,
            description: e.description || '',
            category: e.category as CategoryName,
            amount: Number(e.amount),
            budgetPlanId: e.budget_plan_id,
          }));

          setAllExpenses(mappedAll);
          // Current month expenses: strictly filter to current selected budget plan
          setExpenses(mappedAll.filter(e => e.budgetPlanId === planId));
        } else {
          setAllExpenses([]);
          setExpenses([]);
        }
      } else {
        setAllExpenses([]);
        setExpenses([]);
      }

      // 4. Fetch Savings Goals and their real Contributions
      const { data: goalsData, error: goalsFetchError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (goalsFetchError) {
        console.error('Error fetching savings goals:', goalsFetchError.message);
      }

      if (goalsData && goalsData.length > 0) {
        const goalIds = goalsData.map(g => g.id);
        // Table 7: id, goal_id, amount, contribution_date, description, created_at
        // STRICT: Filter by goal_id only (no user_id column in savings_contributions schema)
        const { data: contribsData, error: contribsFetchError } = await supabase
          .from('savings_contributions')
          .select('id, goal_id, amount, contribution_date, description, created_at')
          .in('goal_id', goalIds);

        if (contribsFetchError) {
          console.error('Error fetching savings contributions:', contribsFetchError.message);
        }

        const savedMap = new Map<string, number>();
        (contribsData || []).forEach(c => {
          savedMap.set(c.goal_id, (savedMap.get(c.goal_id) || 0) + Number(c.amount));
        });

        setFuturePurchases(
          goalsData.map(g => {
            const cost = Number(g.target_amount);
            const saved = savedMap.get(g.id) || 0;
            const targetDate = g.target_date || 'December 2026';
            const status = getGoalStatus(cost, saved, targetDate);
            return {
              id: g.id,
              title: g.title,
              cost,
              saved,
              targetDate,
              targetMonthIndex: 11,
              priority: (g.priority as 'High' | 'Medium' | 'Low') || 'Medium',
              monthlyContribution: Number(g.monthly_contribution || Math.max(100, Math.round(cost / 6))),
              icon: g.icon || 'Tag',
              status,
            };
          })
        );
      } else {
        setFuturePurchases([]);
      }
    } catch (err) {
      console.error('Failed to load user financial data:', err);
      addToast('error', 'Sync Error', 'Failed to load financial records from database.');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Dynamically compute spent per category from real expenses
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
    return savingsCat ? savingsCat.planned : 0;
  }, [categoryAllocations]);

  const { budgetHealthScore, budgetHealthChecklist } = useMemo(() => {
    if (monthlyBudget === 0 && expenses.length === 0) {
      return {
        budgetHealthScore: 100,
        budgetHealthChecklist: [{ text: 'Set a monthly budget to begin tracking health', status: 'ok' as const }],
      };
    }

    let score = 100;
    const checklist: { text: string; status: 'ok' | 'warning' | 'error' }[] = [];

    if (totalSpent > monthlyBudget) {
      score -= 30;
      checklist.push({ text: `Total spending exceeds budget by ₹${(totalSpent - monthlyBudget).toLocaleString('en-IN')}`, status: 'error' });
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
    if (foodCat && foodCat.spent > foodCat.planned && foodCat.planned > 0) {
      score -= 10;
      checklist.push({ text: 'Food spending higher than planned', status: 'warning' });
    }

    const shoppingCat = computedCategoryAllocations.find((c) => c.name === 'Shopping');
    if (shoppingCat && shoppingCat.spent > shoppingCat.planned && shoppingCat.planned > 0) {
      score -= 8;
      checklist.push({ text: 'Shopping allocation exceeded', status: 'warning' });
    }

    if (totalAllocated > monthlyBudget) {
      score -= 15;
      checklist.push({ text: `Planned allocations exceed budget by ₹${(totalAllocated - monthlyBudget).toLocaleString('en-IN')}`, status: 'error' });
    }

    return {
      budgetHealthScore: Math.max(20, Math.min(100, score)),
      budgetHealthChecklist: checklist,
    };
  }, [totalSpent, monthlyBudget, currentSavings, computedCategoryAllocations, totalAllocated, expenses.length]);

  // Real Database Mutation: setMonthlyBudget
  const setMonthlyBudget = async (amount: number) => {
    const validAmount = Math.max(0, amount);
    setMonthlyBudgetState(validAmount);
    if (!user || !currentPlanId || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('budget_plan')
        .update({ total_budget: validAmount, updated_at: new Date().toISOString() })
        .eq('id', currentPlanId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update monthly budget in Supabase:', error.message);
        addToast('error', 'Update Failed', error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Real Database Mutation: addExpense
  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user || !isSupabaseConfigured) {
      addToast('error', 'Session Required', 'You must be logged in to add expenses.');
      return;
    }

    if (expenseData.amount <= 0) {
      addToast('error', 'Invalid Amount', 'Expense amount must be greater than zero.');
      return;
    }

    try {
      const formattedDate = formatExpenseDate(expenseData.date);
      const expMonth = normalizeToFirstDayOfMonth(formattedDate);

      // Identify or dynamically provision the budget_plan record for this expense's month
      let targetPlanId = expMonth === selectedMonth && currentPlanId ? currentPlanId : null;
      if (!targetPlanId) {
        targetPlanId = await getOrCreatePlanForMonth(expMonth);
      }

      if (!targetPlanId) {
        addToast('error', 'Budget Plan Missing', 'Could not locate or create a budget plan for the expense month.');
        return;
      }

      // Table 4: id, budget_plan_id, category, description, amount, expense_date, created_at
      // STRICT: No user_id column in expenses schema
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          budget_plan_id: targetPlanId,
          amount: expenseData.amount,
          description: expenseData.description.trim(),
          category: expenseData.category,
          expense_date: formattedDate,
        })
        .select('id, budget_plan_id, category, description, amount, expense_date, created_at')
        .single();

      if (error) {
        addToast('error', 'Error Adding Expense', error.message);
        return;
      }

      if (data) {
        const newExp: Expense = {
          id: data.id,
          amount: Number(data.amount),
          description: data.description || '',
          category: data.category as CategoryName,
          date: data.expense_date,
          budgetPlanId: data.budget_plan_id,
        };

        // Synchronize all-time historical expenses collection
        setAllExpenses((prev) => [newExp, ...prev].sort((a, b) => b.date.localeCompare(a.date)));

        // If the new expense belongs to the current selected month's plan, update monthly expenses
        if (targetPlanId === currentPlanId) {
          setExpenses((prev) => [newExp, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
        }

        addToast('success', 'Expense Added', `Added ₹${newExp.amount} for ${newExp.description}`);
      }
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  // Real Database Mutation: editExpense
  const editExpense = async (id: string, expenseData: Omit<Expense, 'id'>) => {
    if (!user || !isSupabaseConfigured) {
      addToast('error', 'Session Required', 'You must be logged in to edit expenses.');
      return;
    }

    if (expenseData.amount <= 0) {
      addToast('error', 'Invalid Amount', 'Expense amount must be greater than zero.');
      return;
    }

    // Locate expense in either allExpenses or monthly expenses
    const existing = allExpenses.find((e) => e.id === id) || expenses.find((e) => e.id === id);
    if (!existing) {
      addToast('error', 'Not Found', 'Expense record not found.');
      return;
    }

    // Verify ownership by confirming the associated budget_plan belongs to this authenticated user
    const isOwned = userPlans.some((p) => p.id === existing.budgetPlanId) || existing.budgetPlanId === currentPlanId;
    if (!isOwned && userPlans.length > 0) {
      addToast('error', 'Unauthorized', 'You do not have permission to modify this expense.');
      return;
    }

    try {
      const formattedDate = formatExpenseDate(expenseData.date);
      const newExpMonth = normalizeToFirstDayOfMonth(formattedDate);

      let targetPlanId = existing.budgetPlanId || currentPlanId;
      // If the expense date moved into a different month, assign it to that month's budget plan
      if (existing.date && newExpMonth !== normalizeToFirstDayOfMonth(existing.date)) {
        const provisioned = await getOrCreatePlanForMonth(newExpMonth);
        if (provisioned) {
          targetPlanId = provisioned;
        }
      }

      // Table 4: id, budget_plan_id, category, description, amount, expense_date, created_at
      // STRICT: No user_id column, no updated_at column
      const { error } = await supabase
        .from('expenses')
        .update({
          budget_plan_id: targetPlanId,
          amount: expenseData.amount,
          description: expenseData.description.trim(),
          category: expenseData.category,
          expense_date: formattedDate,
        })
        .eq('id', id);

      if (error) {
        addToast('error', 'Error Updating', error.message);
        return;
      }

      const updatedExp: Expense = {
        id,
        amount: expenseData.amount,
        description: expenseData.description.trim(),
        category: expenseData.category,
        date: formattedDate,
        budgetPlanId: targetPlanId || undefined,
      };

      // Synchronize allExpenses
      setAllExpenses((prev) =>
        prev.map((item) => (item.id === id ? updatedExp : item)).sort((a, b) => b.date.localeCompare(a.date))
      );

      // Synchronize current month expenses collection
      if (targetPlanId === currentPlanId) {
        setExpenses((prev) => {
          const exists = prev.some((item) => item.id === id);
          if (exists) {
            return prev.map((item) => (item.id === id ? updatedExp : item)).sort((a, b) => b.date.localeCompare(a.date));
          }
          return [updatedExp, ...prev].sort((a, b) => b.date.localeCompare(a.date));
        });
      } else {
        // If moved to a different month, remove from current month view
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      }

      addToast('info', 'Expense Updated', `Updated details for ${expenseData.description}`);
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Failed to update expense');
    }
  };

  // Real Database Mutation: deleteExpense
  const deleteExpense = async (id: string) => {
    const item = allExpenses.find((e) => e.id === id) || expenses.find((e) => e.id === id);

    if (!user || !isSupabaseConfigured) {
      addToast('error', 'Session Required', 'You must be logged in to delete expenses.');
      return;
    }

    // Verify ownership by confirming the associated budget plan belongs to this authenticated user
    if (item?.budgetPlanId && userPlans.length > 0) {
      const isOwned = userPlans.some((p) => p.id === item.budgetPlanId) || item.budgetPlanId === currentPlanId;
      if (!isOwned) {
        addToast('error', 'Unauthorized', 'You do not have permission to delete this expense.');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        addToast('error', 'Error Deleting', error.message);
        return;
      }

      setAllExpenses((prev) => prev.filter((e) => e.id !== id));
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      addToast('warning', 'Expense Deleted', `Removed ${item?.description || 'expense'}`);
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const updateCategoryPlanned = (categoryName: CategoryName, newAmount: number) => {
    setCategoryAllocations((prev) =>
      prev.map((cat) => (cat.name === categoryName ? { ...cat, planned: newAmount } : cat))
    );
  };

  const resetBudgetAllocations = async () => {
    const defaultAllocations = BASE_CATEGORIES.map(b => ({
      name: b.name,
      planned: b.defaultPlanned,
      spent: 0,
      iconName: b.iconName,
      minRange: b.minRange,
      maxRange: b.maxRange,
      color: b.color,
    }));
    setCategoryAllocations(defaultAllocations);

    if (user && currentPlanId && isSupabaseConfigured) {
      try {
        // Table 1: id, budget_plan_id, category, allocated_amount, created_at (no updated_at)
        const resetRows = BASE_CATEGORIES.map(cat => ({
          budget_plan_id: currentPlanId,
          category: cat.name,
          allocated_amount: cat.defaultPlanned,
        }));

        const { error: resetErr } = await supabase
          .from('budget_categories')
          .upsert(resetRows, { onConflict: 'budget_plan_id,category' });

        if (resetErr) {
          console.error('Error persisting reset allocations:', resetErr.message);
          addToast('error', 'Reset Warning', resetErr.message);
          return;
        }
      } catch (err) {
        console.error('Error persisting reset allocations:', err);
      }
    }

    addToast('info', 'Budget Reset', 'Allocations restored to recommended default.');
  };

  const saveBudgetAllocations = async () => {
    if (!user || !currentPlanId || !isSupabaseConfigured) {
      addToast('error', 'Cannot Save', 'No active budget plan found to save allocations.');
      return;
    }

    try {
      // Upsert all categories (Table 1: id, budget_plan_id, category, allocated_amount, created_at - no updated_at)
      const upsertRows = categoryAllocations.map(cat => ({
        budget_plan_id: currentPlanId,
        category: cat.name,
        allocated_amount: Math.max(0, cat.planned),
      }));

      const { error: catError } = await supabase
        .from('budget_categories')
        .upsert(upsertRows, { onConflict: 'budget_plan_id,category' });

      if (catError) {
        addToast('error', 'Error Saving Categories', catError.message);
        return;
      }

      // Also update monthly budget in Table 2: budget_plan
      const { error: planError } = await supabase
        .from('budget_plan')
        .update({
          total_budget: Math.max(0, monthlyBudget),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentPlanId)
        .eq('user_id', user.id);

      if (planError) {
        addToast('error', 'Error Updating Total Budget', planError.message);
        return;
      }

      // Persist monthly savings plan target if Savings category is present (Table 5)
      const savingsCat = categoryAllocations.find(c => c.name === 'Savings');
      if (savingsCat) {
        const { error: savingsError } = await supabase
          .from('monthly_savings_plans')
          .upsert(
            {
              user_id: user.id,
              month: selectedMonth,
              planned_amount: Math.max(0, savingsCat.planned),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,month' }
          );

        if (savingsError) {
          console.error('Error updating monthly savings plan:', savingsError.message);
        }
      }

      addToast('success', 'Budget Saved', 'Your monthly budget plan has been saved to the database.');
    } catch (err: unknown) {
      addToast('error', 'Save Error', err instanceof Error ? err.message : 'Failed to save budget plan');
    }
  };

  // Real Database Mutation: addFuturePurchase (savings_goals)
  const addFuturePurchase = async (data: {
    title: string;
    cost: number;
    targetDate: string;
    priority: 'High' | 'Medium' | 'Low';
    icon?: string;
  }) => {
    const monthlyContrib = Math.max(100, Math.round(data.cost / 6));
    const targetDateDb = parseTargetDateToDate(data.targetDate) || data.targetDate;
    const selectedIcon = data.icon || 'Tag';
    const status = getGoalStatus(data.cost, 0, targetDateDb);

    if (!user || !isSupabaseConfigured) {
      const newPurchase: FuturePurchase = {
        id: `pur-${Date.now()}`,
        title: data.title,
        cost: data.cost,
        saved: 0,
        targetDate: targetDateDb,
        targetMonthIndex: 11,
        priority: data.priority,
        monthlyContribution: monthlyContrib,
        icon: selectedIcon,
        status,
      };
      setFuturePurchases((prev) => [...prev, newPurchase]);
      addToast('success', 'Goal Added', `Created target for ${data.title}`);
      return;
    }

    try {
      // Primary insert attempt with all columns
      const insertPayload: Record<string, unknown> = {
        user_id: user.id,
        title: data.title,
        target_amount: data.cost,
        target_date: targetDateDb,
        priority: data.priority,
        monthly_contribution: monthlyContrib,
        icon: selectedIcon,
      };

      let { data: insertedGoal, error } = await supabase
        .from('savings_goals')
        .insert(insertPayload)
        .select()
        .single();

      // Graceful fallback if live Supabase schema is missing 'icon' or 'monthly_contribution'
      if (
        error &&
        (error.message.includes("'icon' column") || error.message.includes("'monthly_contribution' column"))
      ) {
        console.warn('Retrying goal insert without optional schema columns:', error.message);
        delete insertPayload.icon;
        delete insertPayload.monthly_contribution;
        const retryResult = await supabase
          .from('savings_goals')
          .insert(insertPayload)
          .select()
          .single();
        insertedGoal = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        addToast('error', 'Goal Creation Failed', error.message);
        return;
      }

      if (insertedGoal) {
        const newPurchase: FuturePurchase = {
          id: insertedGoal.id,
          title: insertedGoal.title,
          cost: Number(insertedGoal.target_amount),
          saved: 0,
          targetDate: insertedGoal.target_date || targetDateDb,
          targetMonthIndex: 11,
          priority: (insertedGoal.priority as 'High' | 'Medium' | 'Low') || data.priority,
          monthlyContribution: Number(insertedGoal.monthly_contribution ?? monthlyContrib),
          icon: insertedGoal.icon || selectedIcon,
          status,
        };
        setFuturePurchases((prev) => [...prev, newPurchase]);
        addToast('success', 'Goal Added', `Created target for ${data.title}`);
      }
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Failed to create goal');
    }
  };

  // Real Database Mutation: recordContribution (savings_contributions)
  const recordContribution = async (goalId: string, amount: number) => {
    if (amount <= 0) {
      addToast('error', 'Invalid Amount', 'Contribution amount must be greater than zero.');
      return;
    }

    if (!user || !isSupabaseConfigured) {
      addToast('error', 'Authentication Required', 'Please sign in to record contributions.');
      return;
    }

    try {
      // Table 7: id, goal_id, amount, contribution_date, description, created_at
      // STRICT: No user_id column in savings_contributions schema
      const { error } = await supabase
        .from('savings_contributions')
        .insert({
          goal_id: goalId,
          amount,
          contribution_date: new Date().toISOString().split('T')[0],
          description: 'Contribution toward goal',
        });

      if (error) {
        addToast('error', 'Failed to record contribution', error.message);
        return;
      }

      // Update local state and recompute status
      setFuturePurchases((prev) =>
        prev.map((p) => {
          if (p.id !== goalId) return p;
          const newSaved = p.saved + amount;
          return {
            ...p,
            saved: newSaved,
            status: getGoalStatus(p.cost, newSaved, p.targetDate),
          };
        })
      );
      addToast('success', 'Contribution Added', `Recorded ₹${amount.toLocaleString('en-IN')} saved toward goal!`);
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Failed to record contribution');
    }
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
      priority: p.priority,
      status: p.status || getGoalStatus(p.cost, p.saved, p.targetDate),
    }));
  }, [futurePurchases]);

  const updateGoalContribution = async (goalId: string, monthlyContrib: number) => {
    const goal = futurePurchases.find((p) => p.id === goalId);
    if (!goal) return;

    const remaining = Math.max(0, goal.cost - goal.saved);
    const newTargetDate = calculateNewTargetDate(remaining, monthlyContrib);
    const newStatus = getGoalStatus(goal.cost, goal.saved, newTargetDate);

    // Save previous state for rollback on error
    const prevPurchases = [...futurePurchases];

    // Optimistic update
    setFuturePurchases((prev) =>
      prev.map((p) =>
        p.id === goalId
          ? {
              ...p,
              monthlyContribution: monthlyContrib,
              targetDate: newTargetDate,
              status: newStatus,
            }
          : p
      )
    );

    if (user && isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, unknown> = {
          monthly_contribution: monthlyContrib,
          target_date: newTargetDate,
          updated_at: new Date().toISOString(),
        };

        let { error } = await supabase
          .from('savings_goals')
          .update(updatePayload)
          .eq('id', goalId)
          .eq('user_id', user.id);

        if (error && error.message.includes("'monthly_contribution' column")) {
          delete updatePayload.monthly_contribution;
          const retry = await supabase
            .from('savings_goals')
            .update(updatePayload)
            .eq('id', goalId)
            .eq('user_id', user.id);
          error = retry.error;
        }

        if (error) {
          console.error('Error updating goal monthly contribution in Supabase:', error.message);
          addToast('error', 'Update Failed', error.message);
          // Rollback
          setFuturePurchases(prevPurchases);
        }
      } catch (err) {
        console.error('Error updating goal monthly contribution:', err);
        setFuturePurchases(prevPurchases);
      }
    }
  };

  // What-If Simulator Sandbox State (MUST NOT modify DB until applied)
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
      impactMessage = `⚠ Increasing monthly expenses by ₹${extra.toLocaleString('en-IN')} reduces available savings potential by ${Math.round((extra / Math.max(1, monthlyBudget)) * 100)}%.`;
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

  const applySimulation = async () => {
    if (simScenario.type === 'buy') {
      await addExpense({
        date: new Date().toISOString().split('T')[0],
        description: `Simulated Purchase (${simScenario.name})`,
        category: 'Shopping',
        amount: simScenario.amount,
      });
      addToast('success', 'Plan Applied!', `Added ₹${simScenario.amount} to actual expenses.`);
    } else if (simScenario.type === 'increase_spend') {
      await setMonthlyBudget(monthlyBudget + simScenario.amount);
      addToast('success', 'Budget Updated', `Increased budget by ₹${simScenario.amount}`);
    } else if (simScenario.type === 'decrease_spend') {
      const currentShopPlanned = categoryAllocations.find((c) => c.name === 'Shopping')?.planned || 1500;
      const newShopPlanned = Math.max(500, currentShopPlanned - simScenario.amount);
      updateCategoryPlanned('Shopping', newShopPlanned);
      await saveBudgetAllocations();
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
        selectedMonth,
        setSelectedMonth,
        monthlyBudget,
        setMonthlyBudget,
        expenses,
        allExpenses,
        categoryAllocations: computedCategoryAllocations,
        totalSpent,
        totalRemaining,
        totalAllocated,
        unallocatedAmount,
        currentSavings,
        budgetHealthScore,
        budgetHealthChecklist,
        isLoadingData,
        refreshData: loadUserData,
        addExpense,
        editExpense,
        deleteExpense,
        updateCategoryPlanned,
        resetBudgetAllocations,
        saveBudgetAllocations,
        futurePurchases,
        addFuturePurchase,
        recordContribution,
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
