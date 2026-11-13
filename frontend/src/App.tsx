import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { AddPurchaseModal } from './components/modals/AddPurchaseModal';

import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { BudgetPlanner } from './pages/BudgetPlanner';
import { FuturePurchases } from './pages/FuturePurchases';
import { SavingsGoals } from './pages/SavingsGoals';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { Wallet } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentPage, accessibility, isLoadingData } = useBudget();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <Expenses />;
      case 'planner':
        return <BudgetPlanner />;
      case 'purchases':
        return <FuturePurchases />;
      case 'goals':
        return <SavingsGoals />;
      case 'simulator':
        return <WhatIfSimulator />;
      case 'insights':
        return <Insights />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen flex bg-slate-50 text-slate-800 ${accessibility.highContrast ? 'high-contrast' : ''}`}>
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Header />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-toast">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Loading your financial data...</p>
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Modals & Toasts */}
      <AddExpenseModal />
      <AddPurchaseModal />
      <ToastContainer />
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-pulse">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Loading SpendWise...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BudgetProvider>
      <MainContent />
    </BudgetProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
