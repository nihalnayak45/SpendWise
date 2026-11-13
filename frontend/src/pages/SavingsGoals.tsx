import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { IconMapper } from '../components/common/IconMapper';
import type { SavingsGoal } from '../types/budget';
import { formatDisplayDate } from '../lib/budgetUtils';
import { Calendar, Zap, Plus, PiggyBank, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const SavingsGoals: React.FC = () => {
  const { savingsGoals, updateGoalContribution, setIsAddPurchaseModalOpen, recordContribution } = useBudget();

  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await recordContribution(contributingGoal.id, amount);
      setContributingGoal(null);
      setContributionAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Savings Goals</h2>
          <p className="text-xs text-slate-500 font-medium">
            Dynamically adjust your monthly contributions and record real savings contributions toward each target
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
      {savingsGoals.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-sm text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No savings goals created yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start planning a major purchase like a laptop, course certification, or trip to track your progress with interactive calculations.
            </p>
          </div>
          <button
            onClick={() => setIsAddPurchaseModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savingsGoals.map((goal: SavingsGoal) => {
            const progress = Math.min(100, Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100));

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
                      <p className="text-xs text-slate-500 font-medium">Target: {formatDisplayDate(goal.targetDate)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-teal-700">{progress}% Completed</span>
                      {goal.status && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex items-center gap-0.5 border ${
                            goal.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : goal.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}
                        >
                          {goal.status === 'Completed' ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : goal.status === 'Overdue' ? (
                            <AlertCircle className="w-2.5 h-2.5" />
                          ) : (
                            <Clock className="w-2.5 h-2.5" />
                          )}
                          {goal.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress visual */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        goal.status === 'Completed' ? 'bg-emerald-600' : 'bg-teal-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
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
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> {formatDisplayDate(goal.targetDate)}
                    </span>
                  </div>
                </div>

                {/* Record Contribution Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    Remaining: ₹{Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => {
                      setContributingGoal(goal);
                      setContributionAmount('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200/60 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Saved Amount</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Contribution Modal */}
      {contributingGoal && (
        <Modal
          isOpen={Boolean(contributingGoal)}
          onClose={() => setContributingGoal(null)}
          title={`Record Saving for ${contributingGoal.title}`}
        >
          <form onSubmit={handleRecordContribution} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Enter the actual amount you have put aside into your savings account for{' '}
              <strong className="text-slate-900">{contributingGoal.title}</strong>. This updates your real database contributions.
            </p>

            <div>
              <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Amount Saved (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  placeholder="e.g. 1000"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:bg-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setContributingGoal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !contributionAmount}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-teal-600/20"
              >
                {isSubmitting ? 'Saving...' : 'Add Contribution'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
