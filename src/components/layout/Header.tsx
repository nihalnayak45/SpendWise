import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Plus, Sparkles, Bell, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { setIsAddExpenseModalOpen, setCurrentPage, monthlyBudget, totalSpent } = useBudget();

  const formattedBudget = monthlyBudget.toLocaleString('en-IN');
  const formattedSpent = totalSpent.toLocaleString('en-IN');

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
      {/* Greeting Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Good morning, Nihal 👋
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> On Track
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Here's how your money is looking this month (Budget: ₹{formattedBudget} • Spent: ₹{formattedSpent})
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <button
          onClick={() => setCurrentPage('simulator')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">Simulate Decisions</span>
          <span className="sm:hidden">What-If?</span>
        </button>

        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>

        <button
          onClick={() => setCurrentPage('insights')}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          aria-label="Notifications & Insights"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500"></span>
        </button>
      </div>
    </header>
  );
};
