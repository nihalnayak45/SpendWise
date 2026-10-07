import React from 'react';
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

const MainContent: React.FC = () => {
  const { currentPage, accessibility } = useBudget();

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
          {renderPage()}
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

export default function App() {
  return (
    <BudgetProvider>
      <MainContent />
    </BudgetProvider>
  );
}
