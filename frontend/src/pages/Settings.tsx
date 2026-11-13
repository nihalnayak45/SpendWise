import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Eye, Contrast, Sliders, ShieldCheck, LogOut, RefreshCw, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { accessibility, updateAccessibility, addToast, refreshData } = useBudget();
  const { profile, user, signOut, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingName(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        addToast('error', 'Update Failed', error.message);
      } else {
        await refreshProfile();
        addToast('success', 'Profile Updated', 'Your full name has been updated.');
      }
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings & Accessibility</h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage your account profile, Supabase sync, and accessible display preferences
        </p>
      </div>

      {/* USER PROFILE SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          <span>User Profile</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Email Account</label>
              <input
                type="text"
                readOnly
                value={user?.email || 'Authenticated User'}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Supabase Authenticated ID: <code className="text-[11px] font-mono text-slate-500">{user?.id}</code></span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
              Active Session
            </span>
          </div>
        </form>
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

      {/* ACCOUNT & SESSION CONTROLS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-600" />
          <span>Database & Session Controls</span>
        </h3>
        <p className="text-xs text-slate-500">
          Sync active records from Supabase or sign out of your current session.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={async () => {
              await refreshData();
              addToast('info', 'Data Synchronized', 'Fetched latest records from Supabase.');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync with Database</span>
          </button>

          <button
            onClick={() => signOut()}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
