import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import type { PageId } from '../../types/budget';
import {
  LayoutDashboard,
  Receipt,
  Sliders,
  Sparkles,
  Menu,
  X,
  Target,
  TrendingUp,
  Wallet,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentPage, setCurrentPage } = useBudget();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-5 h-5" /> },
    { id: 'planner', label: 'Planner', icon: <Sliders className="w-5 h-5" /> },
    { id: 'simulator', label: 'What-If', icon: <Sparkles className="w-5 h-5" /> },
  ];

  const handleTabClick = (pageId: PageId) => {
    setCurrentPage(pageId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 text-white rounded-t-3xl p-6 border-t border-slate-800 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold">Menu & Features</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleTabClick('purchases')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200"
              >
                <Target className="w-5 h-5 text-teal-400" />
                <span className="text-sm font-semibold">Purchases</span>
              </button>
              <button
                onClick={() => handleTabClick('goals')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200"
              >
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <span className="text-sm font-semibold">Savings Goals</span>
              </button>
              <button
                onClick={() => handleTabClick('insights')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200"
              >
                <Wallet className="w-5 h-5 text-teal-400" />
                <span className="text-sm font-semibold">AI Insights</span>
              </button>
              <button
                onClick={() => handleTabClick('settings')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200"
              >
                <Settings className="w-5 h-5 text-teal-400" />
                <span className="text-sm font-semibold">Settings</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800 mt-4">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                N
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Nihal</h4>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Student Plan (₹15,000 / mo)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
        {mainTabs.map((tab) => {
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-medium ${
            isMenuOpen ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
