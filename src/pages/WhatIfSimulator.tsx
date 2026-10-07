import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { Sparkles, RotateCcw, CheckCircle2, ShieldAlert, ShoppingBag, TrendingUp, TrendingDown, PiggyBank, Calendar } from 'lucide-react';
import type { SimulationScenario } from '../types/budget';

export const WhatIfSimulator: React.FC = () => {
  const {
    monthlyBudget,
    currentSavings,
    totalRemaining,
    budgetHealthScore,
    simulation,
    setSimulationAmount,
    setSimulationType,
    applySimulation,
    resetSimulation,
  } = useBudget();

  const scenarios: { type: SimulationScenario['type']; label: string; icon: React.ReactNode }[] = [
    { type: 'buy', label: 'Buy something new (₹5,000)', icon: <ShoppingBag className="w-4 h-4" /> },
    { type: 'increase_spend', label: 'Increase monthly spend', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'decrease_spend', label: 'Cut down expenses', icon: <TrendingDown className="w-4 h-4" /> },
    { type: 'increase_savings', label: 'Boost monthly savings', icon: <PiggyBank className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">What If?</h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Explore financial decisions before you make them. Safe sandbox mode.
            </p>
          </div>
        </div>
      </div>

      {/* CURRENT BASELINE CARDS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Current Baseline Plan</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Budget</span>
            <span className="text-base font-extrabold text-slate-900">₹{monthlyBudget.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Savings</span>
            <span className="text-base font-extrabold text-teal-700">₹{currentSavings.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Remaining</span>
            <span className="text-base font-extrabold text-slate-900">₹{totalRemaining.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Budget Health</span>
            <span className="text-base font-extrabold text-emerald-600">{budgetHealthScore} / 100</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS CONTAINER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <span>What would happen if...</span>
        </h3>

        {/* Scenario Selector Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((sc) => {
            const isSelected = simulation.scenario?.type === sc.type;
            return (
              <button
                key={sc.type}
                onClick={() => setSimulationType(sc.type)}
                className={`p-3.5 rounded-xl border text-left font-bold text-xs transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-2'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-slate-800 text-amber-300' : 'bg-white text-slate-600'}`}>
                  {sc.icon}
                </div>
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Large Amount Slider Input */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Set Decision Amount (₹)
            </label>
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{simulation.scenario?.amount.toLocaleString('en-IN')}
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="30000"
            step="500"
            value={simulation.scenario?.amount || 5000}
            onChange={(e) => setSimulationAmount(parseInt(e.target.value))}
            className="w-full"
            aria-label="Adjust simulation decision amount"
          />

          <div className="flex justify-between text-[11px] font-semibold text-slate-400">
            <span>₹1,000</span>
            <span>₹15,000</span>
            <span>₹30,000</span>
          </div>
        </div>
      </div>

      {/* BEFORE VS AFTER COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BEFORE CARD */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">BEFORE (Actual Plan)</h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
              Current Baseline
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Monthly Savings:</span>
              <span className="font-extrabold text-slate-900">₹{currentSavings.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Laptop Target Date:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" /> December 2026
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Budget Health Score:</span>
              <span className="font-extrabold text-emerald-600">{budgetHealthScore} / 100</span>
            </div>
          </div>
        </div>

        {/* AFTER CARD */}
        <div className={`bg-white rounded-2xl p-6 border-2 shadow-md space-y-4 ${
          simulation.isOverBudget ? 'border-rose-300 bg-rose-50/20' : 'border-teal-500 bg-teal-50/20'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">AFTER (Simulated Plan)</h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white shadow-sm">
              Simulated Result
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-200/50">
              <span className="text-slate-600 font-medium">Monthly Savings:</span>
              <span className="font-extrabold text-teal-700">₹{simulation.simulatedSavings.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/50">
              <span className="text-slate-600 font-medium">Laptop Target Date:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> {simulation.simulatedGoalDate}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600 font-medium">Budget Health Score:</span>
              <span className={`font-extrabold ${simulation.simulatedHealthScore < 60 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {simulation.simulatedHealthScore} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* IMPACT CALLOUT BANNER */}
      <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm ${
        simulation.isOverBudget
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-extrabold uppercase tracking-wider">Estimated Financial Impact</h4>
          <p className="text-xs font-semibold mt-1 leading-relaxed">{simulation.impactMessage}</p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          onClick={resetSimulation}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Simulation</span>
        </button>

        <button
          onClick={applySimulation}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Apply This Plan to Real Budget</span>
        </button>
      </div>
    </div>
  );
};
