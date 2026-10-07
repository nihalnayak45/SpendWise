import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import type { PageId } from '../../types/budget';
import {
  LayoutDashboard,
  Receipt,
  Sliders,
  Sparkles,
  TrendingUp,
  Target,
  Settings,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useBudget();

  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-5 h-5" /> },
    { id: 'planner', label: 'Budget Planner', icon: <Sliders className="w-5 h-5" /> },
    { id: 'purchases', label: 'Future Purchases', icon: <Target className="w-5 h-5" /> },
    { id: 'goals', label: 'Savings Goals', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'simulator', label: 'What-If Simulator', icon: <Sparkles className="w-5 h-5" />, badge: 'HCI Star' },
    { id: 'insights', label: 'Insights', icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen p-4 border-r border-slate-800 flex-shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">SPENDWISE</h1>
          <p className="text-[10px] font-medium text-teal-400 tracking-wider uppercase">Budget & Decision Support</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5" aria-label="Main Sidebar Navigation">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions & User Profile */}
      <div className="pt-4 mt-auto border-t border-slate-800/80 space-y-3">
        <button
          onClick={() => setCurrentPage('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            currentPage === 'settings'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Settings</span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold">
            N
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Nihal</h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Student Plan</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
