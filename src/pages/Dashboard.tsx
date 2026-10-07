import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { CircularProgress } from '../components/common/CircularProgress';
import { IconMapper } from '../components/common/IconMapper';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Target,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { CategoryAllocation, Expense, FuturePurchase } from '../types/budget';

export const Dashboard: React.FC = () => {
  const {
    monthlyBudget,
    totalSpent,
    totalRemaining,
    currentSavings,
    budgetHealthScore,
    budgetHealthChecklist,
    categoryAllocations,
    expenses,
    futurePurchases,
    setIsAddExpenseModalOpen,
    setIsAddPurchaseModalOpen,
    setCurrentPage,
  } = useBudget();

  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const spentPercentage = Math.min(100, Math.round((totalSpent / monthlyBudget) * 100));

  const chartData = [
    { name: 'Food', amount: categoryAllocations.find((c: CategoryAllocation) => c.name === 'Food')?.spent || 3650, color: '#0d9488' },
    { name: 'Transport', amount: categoryAllocations.find((c: CategoryAllocation) => c.name === 'Transport')?.spent || 1200, color: '#3b82f6' },
    { name: 'Shopping', amount: categoryAllocations.find((c: CategoryAllocation) => c.name === 'Shopping')?.spent || 1900, color: '#f59e0b' },
    { name: 'Entertainment', amount: categoryAllocations.find((c: CategoryAllocation) => c.name === 'Entertainment')?.spent || 300, color: '#8b5cf6' },
    { name: 'Bills', amount: categoryAllocations.find((c: CategoryAllocation) => c.name === 'Bills')?.spent || 0, color: '#64748b' },
    { name: 'Education', amount: categoryAllocations.find((c: CategoryAllocation) => c.name === 'Education')?.spent || 450, color: '#06b6d4' },
  ];

  const selectedCategoryDetails = selectedCategory
    ? categoryAllocations.find((c: CategoryAllocation) => c.name.toLowerCase() === selectedCategory.toLowerCase())
    : null;

  return (
    <div className="space-y-6">
      {/* STAR HCI BANNER FOR WHAT-IF SIMULATOR */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 flex-shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                Interactive HCI Tool
              </span>
              <h2 className="text-base font-bold text-white">What-If Decision Simulator</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Thinking of spending ₹5,000 on a phone or trip? Test decisions safely in our sandbox before changing your real budget!
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('simulator')}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 flex-shrink-0"
        >
          <span>Launch Simulator</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* TOP SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Budget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Budget</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">₹{monthlyBudget.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
            <span>Student Baseline</span>
            <span className="text-teal-600 font-semibold">Active</span>
          </div>
        </div>

        {/* Spent */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Spent</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">₹{totalSpent.toLocaleString('en-IN')}</span>
            <span className="text-xs font-bold text-rose-600">{spentPercentage}%</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${spentPercentage > 80 ? 'bg-rose-500' : 'bg-teal-500'}`}
                style={{ width: `${spentPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ₹{totalSpent.toLocaleString('en-IN')} / ₹{monthlyBudget.toLocaleString('en-IN')} spent
            </p>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">₹{totalRemaining.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
            <span>Available Balance</span>
            <span className="text-emerald-600 font-semibold">{100 - spentPercentage}% left</span>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Savings</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-teal-700">₹{currentSavings.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
            <span>Monthly Allocation</span>
            <span className="text-teal-600 font-semibold">Goal Tracked</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: BUDGET HEALTH & SPENDING OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BUDGET HEALTH CARD */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Budget Health</h3>
                <p className="text-xs text-slate-500">Real-time status assessment</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                You're on track
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="my-4 flex justify-center">
              <CircularProgress value={budgetHealthScore} label="Health" />
            </div>

            {/* Checklist items */}
            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
              {budgetHealthChecklist.map((item: { text: string; status: 'ok' | 'warning' | 'error' }, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs font-medium">
                  {item.status === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={item.status === 'ok' ? 'text-slate-700' : 'text-amber-800'}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('planner')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Adjust Allocations</span>
          </button>
        </div>

        {/* SPENDING OVERVIEW RECHARTS VISUALIZATION */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Spending Overview</h3>
                <p className="text-xs text-slate-500">Click any category bar to inspect details</p>
              </div>
              {/* Timeframe Toggle Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                {(['Daily', 'Weekly', 'Monthly'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      timeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Bar Container */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      setSelectedCategory(state.activePayload[0].payload.name);
                    }
                  }}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [`₹${(val || 0).toLocaleString('en-IN')}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} cursor="pointer">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={selectedCategory === entry.name ? '#0f172a' : entry.color}
                        opacity={selectedCategory && selectedCategory !== entry.name ? 0.4 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Detail Panel */}
            {selectedCategoryDetails && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{selectedCategoryDetails.name}:</span>
                  <span className="text-slate-600">
                    Spent ₹{selectedCategoryDetails.spent} of ₹{selectedCategoryDetails.planned} planned
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: PLANNED VS ACTUAL & UPCOMING PURCHASES & RECENT EXPENSES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PLANNED VS ACTUAL HORIZONTAL BARS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Planned vs Actual</h3>
            <span className="text-xs text-slate-500 font-medium">Monthly Breakdown</span>
          </div>

          <div className="space-y-4">
            {categoryAllocations.slice(0, 4).map((cat: CategoryAllocation) => {
              const catPercent = Math.min(100, Math.round((cat.spent / cat.planned) * 100));
              const isOver = cat.spent > cat.planned;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{cat.name}</span>
                    <span className="text-slate-600">
                      Planned ₹{cat.planned.toLocaleString('en-IN')} | <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-900'}>Actual ₹{cat.spent.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : 'bg-teal-600'}`}
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPCOMING PURCHASES */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Upcoming Purchases</h3>
              <button
                onClick={() => setIsAddPurchaseModalOpen(true)}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {futurePurchases.slice(0, 2).map((item: FuturePurchase) => {
                const progress = Math.round((item.saved / item.cost) * 100);
                return (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                          <IconMapper name={item.icon} className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{item.title}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">₹{item.cost.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Target: {item.targetDate}
                      </span>
                      <span className="font-semibold text-teal-700">{progress}% Saved</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('purchases')}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
          >
            <span>View All Future Goals</span>
            <Target className="w-4 h-4" />
          </button>
        </div>

        {/* RECENT EXPENSES */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recent Expenses</h3>
              <button
                onClick={() => setCurrentPage('expenses')}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {expenses.slice(0, 3).map((exp: Expense) => (
                <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <IconMapper name={categoryAllocations.find((c: CategoryAllocation) => c.name === exp.category)?.iconName || 'Tag'} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{exp.description}</h4>
                      <span className="text-[11px] text-slate-400">{exp.date} • {exp.category}</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">₹{exp.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200/60 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>
    </div>
  );
};
