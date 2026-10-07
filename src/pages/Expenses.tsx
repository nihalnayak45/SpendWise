import React, { useState, useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { IconMapper } from '../components/common/IconMapper';
import type { CategoryName, Expense as ExpenseType } from '../types/budget';
import { Search, Plus, Edit2, Trash2, Calendar, Filter } from 'lucide-react';

export const Expenses: React.FC = () => {
  const {
    expenses,
    categoryAllocations,
    deleteExpense,
    setEditingExpense,
    setIsAddExpenseModalOpen,
  } = useBudget();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'This Week' | 'This Month'>('All');

  const categories: (CategoryName | 'All')[] = [
    'All',
    'Food',
    'Transport',
    'Shopping',
    'Entertainment',
    'Bills',
    'Education',
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp: ExpenseType) => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'All' || exp.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expenses</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage your daily transactions and review expenditure history
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setIsAddExpenseModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white transition-colors"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {(['All', 'This Week', 'This Month'] as const).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  dateFilter === df ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {df}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No matching expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp: ExpenseType) => {
                  const catInfo = categoryAllocations.find((c) => c.name.toLowerCase() === exp.category.toLowerCase());
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-slate-500 font-semibold">{exp.date}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{exp.description}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                          <IconMapper name={catInfo?.iconName || 'Tag'} className="w-3.5 h-3.5 text-teal-600" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-900 text-sm">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setIsAddExpenseModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
