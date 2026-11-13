import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { IconMapper } from '../components/common/IconMapper';
import { CircularProgress } from '../components/common/CircularProgress';
import type { CategoryAllocation } from '../types/budget';
import { Sliders, AlertTriangle, CheckCircle, RotateCcw, Save, ShieldAlert } from 'lucide-react';

export const BudgetPlanner: React.FC = () => {
  const {
    monthlyBudget,
    setMonthlyBudget,
    categoryAllocations,
    updateCategoryPlanned,
    totalAllocated,
    unallocatedAmount,
    budgetHealthScore,
    resetBudgetAllocations,
    saveBudgetAllocations,
  } = useBudget();

  const isOverBudget = totalAllocated > monthlyBudget;

  return (
    <div className="space-y-6">
      {/* Title & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-teal-600" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plan Your Monthly Budget</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Drag the sliders below to distribute your monthly funds. Every change updates health & savings immediately.
          </p>
        </div>

        {/* Total Monthly Budget Editable Input */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Monthly Budget</span>
            <div className="flex items-center text-lg font-extrabold text-slate-900">
              <span>₹</span>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Math.max(1000, parseInt(e.target.value) || 0))}
                className="w-24 bg-transparent font-extrabold text-slate-900 focus:outline-none border-b border-dashed border-slate-400 focus:border-teal-600 text-right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* OVER-BUDGET ALERT BANNER (ERROR PREVENTION) */}
      {isOverBudget ? (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-center gap-4 text-rose-900 animate-toast">
          <ShieldAlert className="w-8 h-8 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-extrabold">⚠ Budget Exceeded</h4>
            <p className="text-xs text-rose-700 font-medium mt-0.5">
              Your planned expenses exceed your monthly budget by{' '}
              <span className="font-extrabold underline">₹{(totalAllocated - monthlyBudget).toLocaleString('en-IN')}</span>. Please adjust your sliders.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-900">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-semibold">
            All allocations fit comfortably within your ₹{monthlyBudget.toLocaleString('en-IN')} monthly limit. (Unallocated: ₹{unallocatedAmount.toLocaleString('en-IN')})
          </p>
        </div>
      )}

      {/* MAIN TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CATEGORY SLIDERS LIST (DIRECT MANIPULATION) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Category Allocations</h3>
            <span className="text-xs text-slate-400 font-medium">Real-time Slider Feedback</span>
          </div>

          <div className="space-y-6">
            {categoryAllocations.map((cat: CategoryAllocation) => (
              <div key={cat.name} className="space-y-2 p-3.5 rounded-xl hover:bg-slate-50/70 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
                      <IconMapper name={cat.iconName} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                      <span className="text-[11px] text-slate-400">
                        Spent: ₹{cat.spent.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{cat.planned.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      {Math.round((cat.planned / monthlyBudget) * 100)}% of budget
                    </span>
                  </div>
                </div>

                {/* Range Slider for Direct Manipulation */}
                <div className="pt-1">
                  <input
                    type="range"
                    min={cat.minRange}
                    max={cat.maxRange}
                    step={100}
                    value={cat.planned}
                    onChange={(e) => updateCategoryPlanned(cat.name, parseInt(e.target.value))}
                    className="w-full"
                    aria-label={`Allocate budget for ${cat.name}`}
                  />
                  <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1">
                    <span>Min ₹{cat.minRange.toLocaleString('en-IN')}</span>
                    <span>Max ₹{cat.maxRange.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY & HEALTH SIDEBAR */}
        <div className="space-y-6">
          {/* Real-time Health Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center">
            <h3 className="text-base font-bold text-slate-900 mb-1">Impact on Health</h3>
            <p className="text-xs text-slate-500 mb-4">Dynamically calculated</p>
            <CircularProgress value={budgetHealthScore} size={150} />
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
              {isOverBudget ? (
                <span className="text-rose-600 font-bold flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Over allocation reduces health score!
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">✓ Balanced budget allocation!</span>
              )}
            </div>
          </div>

          {/* Allocation Breakdown Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Plan Summary</h3>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Monthly Budget:</span>
                <span className="font-extrabold text-slate-900">₹{monthlyBudget.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Total Allocated:</span>
                <span className={isOverBudget ? 'font-extrabold text-rose-600' : 'font-extrabold text-teal-700'}>
                  ₹{totalAllocated.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 border-t border-slate-100 pt-2">
                <span>Unallocated Balance:</span>
                <span className={unallocatedAmount < 0 ? 'font-extrabold text-rose-600' : 'font-extrabold text-slate-900'}>
                  ₹{unallocatedAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              <button
                onClick={saveBudgetAllocations}
                disabled={isOverBudget}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Budget Plan</span>
              </button>

              <button
                onClick={resetBudgetAllocations}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
