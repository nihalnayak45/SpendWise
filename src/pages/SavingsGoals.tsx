import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { IconMapper } from '../components/common/IconMapper';
import type { SavingsGoal } from '../types/budget';
import { Calendar, Zap, Plus } from 'lucide-react';

export const SavingsGoals: React.FC = () => {
  const { savingsGoals, updateGoalContribution, setIsAddPurchaseModalOpen } = useBudget();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Savings Goals</h2>
          <p className="text-xs text-slate-500 font-medium">
            Dynamically adjust your monthly contributions to see immediate completion date recalculations
          </p>
        </div>

        <button
          onClick={() => setIsAddPurchaseModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Goal</span>
        </button>
      </div>

      {/* GOALS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.map((goal: SavingsGoal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

          return (
            <div
              key={goal.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6 hover:shadow-md transition-shadow"
            >
              {/* Header info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <IconMapper name={goal.icon} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{goal.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Target: {goal.targetDate}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900">
                    ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-xs font-bold text-teal-700 mt-0.5">{progress}% Completed</span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* DYNAMIC INTERACTIVE SLIDER (HCI DIRECT MANIPULATION) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Monthly Contribution
                  </span>
                  <span className="text-sm font-extrabold text-teal-800">
                    ₹{goal.monthlyContribution.toLocaleString('en-IN')} / month
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="500"
                  value={goal.monthlyContribution}
                  onChange={(e) => updateGoalContribution(goal.id, parseInt(e.target.value))}
                  className="w-full"
                  aria-label={`Adjust monthly contribution for ${goal.title}`}
                />

                {/* Instant Feedback Completion Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs font-medium">
                  <span className="text-slate-500">Estimated Target Date:</span>
                  <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" /> {goal.targetDate}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
