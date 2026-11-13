import React, { useState, useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { IconMapper } from '../components/common/IconMapper';
import type { FuturePurchase } from '../types/budget';
import { formatDisplayDate, parseTargetDateToDate, getGoalStatus } from '../lib/budgetUtils';
import { Plus, Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const FuturePurchases: React.FC = () => {
  const { futurePurchases, setIsAddPurchaseModalOpen } = useBudget();
  const [timelineOffset, setTimelineOffset] = useState(0);

  // Dynamic horizontal timeline: 6 consecutive months based on current date + timelineOffset
  const timelineMonths = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    const months: {
      key: string;
      label: string;
      isCurrent: boolean;
      goals: FuturePurchase[];
    }[] = [];

    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonth + timelineOffset + i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const key = `${year}-${String(monthNum).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const isCurrent = key === currentMonthKey;

      // Find all goals matching this target month
      const matchingGoals = futurePurchases.filter((p: FuturePurchase) => {
        const norm = parseTargetDateToDate(p.targetDate);
        return norm ? norm.startsWith(key) : p.targetDate.toLowerCase().includes(label.toLowerCase());
      });

      months.push({
        key,
        label,
        isCurrent,
        goals: matchingGoals,
      });
    }

    return months;
  }, [futurePurchases, timelineOffset]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plan Your Future Purchases</h2>
          <p className="text-xs text-slate-500 font-medium">
            Set long-term savings targets, monitor dynamic timelines, and manage major college investments
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

      {/* DYNAMIC HORIZONTAL TIMELINE COMPONENT */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Dynamic Purchases Timeline</h3>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
              {futurePurchases.length} Active Goal{futurePurchases.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTimelineOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTimelineOffset(0)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Reset to current month"
            >
              Today
            </button>
            <button
              onClick={() => setTimelineOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 pt-2">
          <div className="flex items-start min-w-[700px] justify-between relative px-6 py-4">
            {/* Horizontal Line connecting nodes */}
            <div className="absolute top-8 left-10 right-10 h-1 bg-slate-200 z-0" />

            {timelineMonths.map((m) => {
              const hasGoals = m.goals.length > 0;
              return (
                <div key={m.key} className="relative z-10 flex flex-col items-center flex-1 max-w-[140px]">
                  {/* Node Icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-all ${
                      hasGoals
                        ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-teal-600/30'
                        : m.isCurrent
                        ? 'bg-slate-900 text-white ring-4 ring-slate-200'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {hasGoals ? m.goals.length : '•'}
                  </div>

                  {/* Month Label with Current Indicator */}
                  <div className="flex flex-col items-center mt-2.5">
                    <span className="text-xs font-bold text-slate-800 text-center">{m.label}</span>
                    {m.isCurrent && (
                      <span className="text-[9px] font-extrabold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded uppercase tracking-wider mt-0.5">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Goal Cards for this Month (All matching goals visible) */}
                  {hasGoals && (
                    <div className="mt-3 flex flex-col gap-1.5 w-full">
                      {m.goals.map((goal) => {
                        const status = goal.status || getGoalStatus(goal.cost, goal.saved, goal.targetDate);
                        return (
                          <div
                            key={goal.id}
                            className="bg-slate-900 text-white p-2 rounded-xl shadow-md border border-slate-800 text-[11px] space-y-0.5 transition-transform hover:scale-105"
                          >
                            <div className="font-bold flex items-center gap-1 truncate text-slate-100">
                              <IconMapper name={goal.icon} className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                              <span className="truncate">{goal.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-teal-300 font-semibold pt-0.5">
                              <span>₹{goal.cost.toLocaleString('en-IN')}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : status === 'Overdue'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-teal-500/20 text-teal-300'
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FUTURE PURCHASES CARDS GRID */}
      {futurePurchases.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-sm text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <Plus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No future purchases planned</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Plan out target purchases like a laptop, headphones, or vacation. We will map them onto your visual schedule timeline.
            </p>
          </div>
          <button
            onClick={() => setIsAddPurchaseModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Purchase Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {futurePurchases.map((purchase: FuturePurchase) => {
            const progress = Math.min(100, Math.round((purchase.saved / Math.max(1, purchase.cost)) * 100));
            const remainingCost = Math.max(0, purchase.cost - purchase.saved);
            const status = purchase.status || getGoalStatus(purchase.cost, purchase.saved, purchase.targetDate);

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
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                              status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                            }`}
                          >
                            {status === 'Completed' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : status === 'Overdue' ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {status}
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
                        Monthly Contribution
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
                      <div
                        className={`h-full rounded-full transition-all ${
                          status === 'Completed' ? 'bg-emerald-600' : 'bg-teal-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" /> Target: {formatDisplayDate(purchase.targetDate)}
                  </span>
                  <span className="font-bold text-slate-700">
                    {remainingCost === 0 ? 'Goal Reached!' : `₹${remainingCost.toLocaleString('en-IN')} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
