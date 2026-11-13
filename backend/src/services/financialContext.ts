import { getScopedSupabaseClient } from './supabase.js';

export interface UserFinancialSummary {
  hasData: boolean;
  userProfile: {
    fullName: string | null;
  };
  monthString: string;
  monthlyBudget: number;
  totalAllocatedBudget: number;
  unallocatedBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUsagePercent: number;
  categoryBreakdown: {
    category: string;
    planned: number;
    spent: number;
    difference: number;
    percentageSpent: number;
    isOverBudget: boolean;
  }[];
  recentExpenses: {
    date: string;
    description: string;
    category: string;
    amount: number;
  }[];
  monthlyTrends: {
    month: string;
    totalBudget: number;
    totalSpent: number;
  }[];
  savingsGoals: {
    id: string;
    title: string;
    targetAmount: number;
    savedSoFar: number;
    remainingAmount: number;
    targetDate: string | null;
    monthlyContribution: number;
    progressPercent: number;
    priority: string;
    status: 'Completed' | 'In Progress' | 'Overdue';
  }[];
  plannedMonthlySavings: number;
  topSpendingCategory: string | null;
}

export function normalizeMonthString(targetMonth?: string): string {
  if (!targetMonth) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  const trimmed = targetMonth.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-01`;
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function getUserFinancialContext(
  userId: string,
  targetMonth?: string,
  userToken?: string
): Promise<UserFinancialSummary> {
  const formattedMonth = normalizeMonthString(targetMonth);
  const supabase = getScopedSupabaseClient(userToken);

  // 1. Fetch user profile from public.profiles
  // Table 6: id, full_name, created_at, updated_at
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  const fullName = profileData?.full_name || null;

  // 2. Fetch all user's budget plans to construct multi-month trend summaries
  const { data: allPlansData } = await supabase
    .from('budget_plan')
    .select('id, user_id, month, total_budget, created_at, updated_at')
    .eq('user_id', userId)
    .order('month', { ascending: false });

  const allPlans = allPlansData || [];
  const budgetPlan = allPlans.find(p => p.month === formattedMonth) || null;
  const monthlyBudget = Number(budgetPlan?.total_budget || 0);
  const budgetPlanId = budgetPlan?.id;

  // 3. Fetch category allocations for the selected budget plan
  let categoryAllocations: { category: string; allocated_amount: number }[] = [];
  if (budgetPlanId) {
    const { data: cats, error: catsError } = await supabase
      .from('budget_categories')
      .select('id, budget_plan_id, category, allocated_amount, created_at')
      .eq('budget_plan_id', budgetPlanId);

    if (catsError) {
      console.error('Error fetching budget categories in financial context:', catsError.message);
    } else if (cats) {
      categoryAllocations = cats.map(c => ({ category: c.category, allocated_amount: Number(c.allocated_amount) }));
    }
  }

  // 4. Fetch expenses for all plans to compute multi-month historical summaries
  const allPlanIds = allPlans.map(p => p.id);
  let expensesList: { date: string; description: string; category: string; amount: number }[] = [];
  const planSpentMap: Record<string, number> = {};

  if (allPlanIds.length > 0) {
    const { data: allExps, error: expsError } = await supabase
      .from('expenses')
      .select('id, budget_plan_id, expense_date, description, category, amount')
      .in('budget_plan_id', allPlanIds)
      .order('expense_date', { ascending: false });

    if (expsError) {
      console.error('Error fetching expenses in financial context:', expsError.message);
    } else if (allExps) {
      for (const e of allExps) {
        const amt = Number(e.amount);
        planSpentMap[e.budget_plan_id] = (planSpentMap[e.budget_plan_id] || 0) + amt;
        if (e.budget_plan_id === budgetPlanId) {
          expensesList.push({
            date: e.expense_date,
            description: e.description || 'Expense',
            category: e.category,
            amount: amt,
          });
        }
      }
    }
  }

  // Multi-month trends
  const monthlyTrends = allPlans.map(p => ({
    month: p.month,
    totalBudget: Number(p.total_budget || 0),
    totalSpent: planSpentMap[p.id] || 0,
  }));

  // Calculate actual spending per category for selected month
  const categorySpentMap: Record<string, number> = {};
  let totalSpent = 0;
  for (const exp of expensesList) {
    totalSpent += exp.amount;
    const catName = exp.category;
    categorySpentMap[catName] = (categorySpentMap[catName] || 0) + exp.amount;
  }

  // Total allocated vs unallocated
  const totalAllocatedBudget = categoryAllocations.reduce((acc, c) => acc + c.allocated_amount, 0);
  const unallocatedBudget = Math.max(0, monthlyBudget - totalAllocatedBudget);

  // Format category breakdown
  const categoryBreakdown = categoryAllocations.map(cat => {
    const spent = categorySpentMap[cat.category] || 0;
    const pct = cat.allocated_amount > 0 ? Math.round((spent / cat.allocated_amount) * 100) : 0;
    return {
      category: cat.category,
      planned: cat.allocated_amount,
      spent,
      difference: cat.allocated_amount - spent,
      percentageSpent: pct,
      isOverBudget: spent > cat.allocated_amount,
    };
  });

  // Top spending category
  let topCategory: string | null = null;
  let maxSpent = 0;
  for (const [cat, spent] of Object.entries(categorySpentMap)) {
    if (spent > maxSpent) {
      maxSpent = spent;
      topCategory = cat;
    }
  }

  // 5. Fetch savings goals
  const { data: goals, error: goalsError } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId);

  if (goalsError) {
    console.error('Error fetching savings goals in financial context:', goalsError.message);
  }

  // 6. Fetch contributions for these goals
  const goalIds = (goals || []).map(g => g.id);
  const contributionsMap: Record<string, number> = {};
  if (goalIds.length > 0) {
    const { data: contribs, error: contribsError } = await supabase
      .from('savings_contributions')
      .select('goal_id, amount')
      .in('goal_id', goalIds);

    if (contribsError) {
      console.error('Error fetching savings contributions in financial context:', contribsError.message);
    } else if (contribs) {
      for (const c of contribs) {
        contributionsMap[c.goal_id] = (contributionsMap[c.goal_id] || 0) + Number(c.amount);
      }
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const structuredGoals = (goals || []).map(g => {
    const target = Number(g.target_amount);
    const saved = contributionsMap[g.id] || 0;
    const remaining = Math.max(0, target - saved);
    const isCompleted = saved >= target && target > 0;
    const isOverdue = !isCompleted && g.target_date && g.target_date < todayStr;
    const status: 'Completed' | 'In Progress' | 'Overdue' = isCompleted
      ? 'Completed'
      : isOverdue
      ? 'Overdue'
      : 'In Progress';

    return {
      id: g.id,
      title: g.title,
      targetAmount: target,
      savedSoFar: saved,
      remainingAmount: remaining,
      targetDate: g.target_date,
      monthlyContribution: Number(g.monthly_contribution || 0),
      progressPercent: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
      priority: g.priority || 'Medium',
      status,
    };
  });

  // 7. Fetch monthly savings plan target
  const { data: monthlySavingsPlan, error: mspError } = await supabase
    .from('monthly_savings_plans')
    .select('planned_amount')
    .eq('user_id', userId)
    .eq('month', formattedMonth)
    .maybeSingle();

  if (mspError) {
    console.error('Error fetching monthly savings plan in financial context:', mspError.message);
  }

  const plannedMonthlySavings = Number(monthlySavingsPlan?.planned_amount || 0);

  const hasData = Boolean(budgetPlan || expensesList.length > 0 || structuredGoals.length > 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetUsagePercent = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;

  return {
    hasData,
    userProfile: { fullName },
    monthString: formattedMonth,
    monthlyBudget,
    totalAllocatedBudget,
    unallocatedBudget,
    totalSpent,
    remainingBudget,
    budgetUsagePercent,
    categoryBreakdown,
    recentExpenses: expensesList.slice(0, 10),
    monthlyTrends,
    savingsGoals: structuredGoals,
    plannedMonthlySavings,
    topSpendingCategory: topCategory,
  };
}
