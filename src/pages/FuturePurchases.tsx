import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { IconMapper } from '../components/common/IconMapper';
import type { FuturePurchase } from '../types/budget';
import { Plus, Calendar } from 'lucide-react';

export const FuturePurchases: React.FC = () => {
  const { futurePurchases, setIsAddPurchaseModalOpen } = useBudget();

  const timelineMonths = ['August', 'September', 'October', 'November', 'December 2026'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plan Your Future Purchases</h2>
          <p className="text-xs text-slate-500 font-medium">
            Set long-term savings targets, monitor timelines, and manage major college investments
          </p>
        </div>

        <button
          onClick={() => setIsAddPurchaseModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Purchase Goal</span>
        </button>
      </div>

      {/* VISUAL TIMELINE COMPONENT */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Purchases Timeline</h3>
          <span className="text-xs text-slate-400 font-medium">Goal Schedule</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[650px] justify-between relative px-4 py-6">
            {/* Horizontal Line */}
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 z-0" />

            {timelineMonths.map((m, idx) => {
              const matchingGoal = futurePurchases.find((p: FuturePurchase) => p.targetDate.toLowerCase().includes(m.toLowerCase().split(' ')[0]));
              return (
                <div key={m} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                      matchingGoal
                        ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                        : 'bg-white border-2 border-slate-300 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-2">{m}</span>

                  {matchingGoal && (
                    <div className="absolute top-12 flex flex-col items-center bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 text-[11px] whitespace-nowrap animate-toast">
                      <span className="font-bold flex items-center gap-1">
                        <IconMapper name={matchingGoal.icon} className="w-3.5 h-3.5 text-teal-400" />
                        {matchingGoal.title}
                      </span>
                      <span className="text-teal-300 text-[10px]">₹{matchingGoal.cost.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FUTURE PURCHASES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {futurePurchases.map((purchase: FuturePurchase) => {
          const progress = Math.min(100, Math.round((purchase.saved / purchase.cost) * 100));
          const remainingCost = Math.max(0, purchase.cost - purchase.saved);

          return (
            <div
              key={purchase.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <IconMapper name={purchase.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{purchase.title}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                            purchase.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : purchase.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {purchase.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{purchase.cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Savings Metrics */}
                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Saved So Far
                    </span>
                    <span className="font-extrabold text-teal-700">₹{purchase.saved.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Required / Mo
                    </span>
                    <span className="font-extrabold text-slate-900">
                      ₹{purchase.monthlyContribution.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-teal-700 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" /> Target: {purchase.targetDate}
                </span>
                <span className="font-bold text-slate-700">₹{remainingCost.toLocaleString('en-IN')} left</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
