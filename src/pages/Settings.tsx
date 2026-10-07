import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { User, Eye, Contrast, Sliders, ShieldCheck, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { accessibility, updateAccessibility, addToast } = useBudget();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings & Accessibility</h2>
        <p className="text-xs text-slate-500 font-medium">
          Customize profile parameters and accessible HCI display options
        </p>
      </div>

      {/* USER PROFILE SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          <span>User Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              readOnly
              value="Nihal"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Plan Tier</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Student Free Tier (₹15,000 / mo baseline)</span>
            </div>
          </div>
        </div>
      </div>

      {/* HCI ACCESSIBILITY CONTROLS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-600" />
          <span>HCI Accessibility Features</span>
        </h3>

        <div className="space-y-4 text-xs font-semibold">
          {/* High Contrast */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Contrast className="w-5 h-5 text-slate-700" />
              <div>
                <span className="block text-slate-900 font-bold">High Contrast Mode</span>
                <span className="text-slate-500 text-[11px] font-normal">Increases borders and visual clarity</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={accessibility.highContrast}
              onChange={(e) => {
                updateAccessibility({ highContrast: e.target.checked });
                addToast('info', 'High Contrast Toggled', e.target.checked ? 'High contrast mode enabled' : 'Default mode restored');
              }}
              className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          {/* Colorblind Mode */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-slate-700" />
              <div>
                <span className="block text-slate-900 font-bold">Colorblind Assist Labels</span>
                <span className="text-slate-500 text-[11px] font-normal">Adds pattern overlays and icon badges to charts</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={accessibility.colorblindMode}
              onChange={(e) => {
                updateAccessibility({ colorblindMode: e.target.checked });
                addToast('info', 'Colorblind Mode', e.target.checked ? 'Pattern labels enabled' : 'Standard colors active');
              }}
              className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-slate-700" />
              <div>
                <span className="block text-slate-900 font-bold">Reduced Motion</span>
                <span className="text-slate-500 text-[11px] font-normal">Disables UI pulse effects and transitions</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={accessibility.reducedMotion}
              onChange={(e) => {
                updateAccessibility({ reducedMotion: e.target.checked });
              }}
              className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* PROTOTYPE RESET CONTROLS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-600" />
          <span>Prototype Data Controls</span>
        </h3>
        <p className="text-xs text-slate-500">
          Reset all mock state to baseline student data (₹15,000 budget, default expenses, initial purchases).
        </p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Prototype Data</span>
        </button>
      </div>
    </div>
  );
};
