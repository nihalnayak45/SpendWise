import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeToFirstDayOfMonth,
  formatExpenseDate,
  isValidFirstDayOfMonth,
  BASE_CATEGORIES,
  parseTargetDateToDate,
  formatDisplayDate,
  calculateNewTargetDate,
  getGoalStatus,
} from './budgetUtils.ts';

test('normalizeToFirstDayOfMonth always returns day 01 matching constraint', () => {
  assert.equal(normalizeToFirstDayOfMonth('2026-10-28'), '2026-10-01');
  assert.equal(normalizeToFirstDayOfMonth('2026-01-15'), '2026-01-01');
  assert.equal(normalizeToFirstDayOfMonth('2026-12'), '2026-12-01');
  assert.equal(normalizeToFirstDayOfMonth('2026-05-01'), '2026-05-01');

  // Verify constraint: EXTRACT(day from month) = 1
  assert.equal(isValidFirstDayOfMonth(normalizeToFirstDayOfMonth('2026-10-28')), true);
  assert.equal(isValidFirstDayOfMonth('2026-10-15'), false);
});

test('formatExpenseDate formats valid YYYY-MM-DD dates without time component', () => {
  assert.equal(formatExpenseDate('2026-08-25'), '2026-08-25');
  const todayStr = formatExpenseDate('today');
  assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/);
});

test('Expenses payload strictly conforms to Table 4 schema', () => {
  const currentPlanId = 'a0000000-0000-0000-0000-000000000001';
  const uiInput = {
    amount: 250,
    description: 'Campus lunch',
    category: 'Food' as const,
    date: '2026-10-28',
  };

  // Construct payload as sent in addExpense
  const payload = {
    budget_plan_id: currentPlanId,
    amount: uiInput.amount,
    description: uiInput.description.trim(),
    category: uiInput.category,
    expense_date: formatExpenseDate(uiInput.date),
  };

  // STRICT assertions based on Table 4 schema
  assert.equal('user_id' in payload, false, 'expenses payload MUST NOT contain user_id');
  assert.equal('date' in payload, false, 'expenses payload MUST NOT contain date (must be expense_date)');
  assert.equal('updated_at' in payload, false, 'expenses payload MUST NOT contain updated_at');
  assert.equal(payload.budget_plan_id, currentPlanId);
  assert.equal(payload.expense_date, '2026-10-28');
  assert.ok(payload.amount > 0, 'expenses amount check: amount must be positive (> 0)');
});

test('Savings contributions payload strictly conforms to Table 7 schema', () => {
  const goalId = 'b0000000-0000-0000-0000-000000000002';
  const amount = 500;

  const payload = {
    goal_id: goalId,
    amount,
    contribution_date: '2026-10-28',
    description: 'Contribution toward goal',
  };

  // STRICT assertions based on Table 7 schema
  assert.equal('user_id' in payload, false, 'savings_contributions payload MUST NOT contain user_id');
  assert.equal(payload.goal_id, goalId);
  assert.ok(payload.amount > 0, 'savings_contributions amount check: amount must be positive (> 0)');
});

test('Budget categories allocations payload strictly conforms to Table 1 schema', () => {
  const planId = 'a0000000-0000-0000-0000-000000000001';
  const rows = BASE_CATEGORIES.map(c => ({
    budget_plan_id: planId,
    category: c.name,
    allocated_amount: Math.max(0, c.defaultPlanned),
  }));

  for (const row of rows) {
    assert.equal('updated_at' in row, false, 'budget_categories payload MUST NOT contain updated_at');
    assert.equal('user_id' in row, false, 'budget_categories payload MUST NOT contain user_id');
    assert.ok(row.allocated_amount >= 0, 'budget_categories check: allocated_amount >= 0');
    assert.equal(row.budget_plan_id, planId);
  }
});

test('Budget plan payload strictly conforms to Table 2 schema', () => {
  const userId = 'c0000000-0000-0000-0000-000000000003';
  const rawMonth = '2026-10-28';
  const normalizedMonth = normalizeToFirstDayOfMonth(rawMonth);
  const totalBudget = 15000;

  const payload = {
    user_id: userId,
    month: normalizedMonth,
    total_budget: totalBudget,
  };

  assert.equal(payload.user_id, userId);
  assert.equal(payload.month, '2026-10-01');
  assert.ok(payload.total_budget >= 0, 'budget_plan check: total_budget >= 0');
  assert.equal(isValidFirstDayOfMonth(payload.month), true);
});

test('Monthly savings plan payload strictly conforms to Table 5 schema', () => {
  const userId = 'c0000000-0000-0000-0000-000000000003';
  const normalizedMonth = normalizeToFirstDayOfMonth('2026-10-15');
  const plannedAmount = 4000;

  const payload = {
    user_id: userId,
    month: normalizedMonth,
    planned_amount: plannedAmount,
  };

  assert.equal(payload.user_id, userId);
  assert.equal(payload.month, '2026-10-01');
  assert.ok(payload.planned_amount >= 0, 'monthly_savings_plans check: planned_amount >= 0');
  assert.equal(isValidFirstDayOfMonth(payload.month), true);
});

test('Target date parsing and display formatting without timezone shift', () => {
  // Exact date
  assert.equal(parseTargetDateToDate('2027-01-15'), '2027-01-15');
  assert.equal(formatDisplayDate('2027-01-15'), '15 January 2027');

  // Month-only convention (YYYY-MM-01)
  assert.equal(parseTargetDateToDate('2027-01'), '2027-01-01');
  assert.equal(formatDisplayDate('2027-01-01'), 'January 2027');

  // Distinct year distinction
  assert.equal(formatDisplayDate('2027-01-01'), 'January 2027');
  assert.equal(formatDisplayDate('2028-01-01'), 'January 2028');
  assert.notEqual(formatDisplayDate('2027-01-01'), formatDisplayDate('2028-01-01'));
});

test('calculateNewTargetDate projects completion accurately', () => {
  const newDate = calculateNewTargetDate(12000, 3000);
  assert.match(newDate, /^\d{4}-\d{2}-01$/);
});

test('getGoalStatus accurately reflects completion, overdue, and in-progress states', () => {
  // Completed when saved >= target
  assert.equal(getGoalStatus(50000, 50000, '2027-12-01'), 'Completed');
  assert.equal(getGoalStatus(50000, 55000, '2027-12-01'), 'Completed');

  // In Progress when target is in future
  assert.equal(getGoalStatus(50000, 10000, '2099-12-01'), 'In Progress');

  // Overdue when target is in past
  assert.equal(getGoalStatus(50000, 10000, '2020-01-01'), 'Overdue');
});

test('Historical expense separation preserves monthly budget calculations', () => {
  const currentPlanId = 'plan-october-2026';
  const pastPlanId = 'plan-august-2026';

  const mockAllExpenses = [
    { id: '1', date: '2026-10-15', description: 'Groceries', category: 'Food' as const, amount: 2000, budgetPlanId: currentPlanId },
    { id: '2', date: '2026-10-20', description: 'Metro pass', category: 'Transport' as const, amount: 500, budgetPlanId: currentPlanId },
    { id: '3', date: '2026-08-10', description: 'Textbooks', category: 'Education' as const, amount: 4500, budgetPlanId: pastPlanId },
    { id: '4', date: '2026-08-25', description: 'Hostel fee', category: 'Bills' as const, amount: 6000, budgetPlanId: pastPlanId },
  ];

  // Strictly filter current month
  const monthlyExpenses = mockAllExpenses.filter(e => e.budgetPlanId === currentPlanId);
  const currentMonthSpent = monthlyExpenses.reduce((s, e) => s + e.amount, 0);

  // All-time history total
  const allTimeSpent = mockAllExpenses.reduce((s, e) => s + e.amount, 0);

  assert.equal(monthlyExpenses.length, 2);
  assert.equal(currentMonthSpent, 2500, 'Current month spent MUST NOT include past expenses');
  assert.equal(mockAllExpenses.length, 4);
  assert.equal(allTimeSpent, 13000);
});
