import React, { useState, useEffect } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Modal } from '../common/Modal';
import type { CategoryName } from '../../types/budget';
import { IndianRupee, Tag, Calendar, FileText } from 'lucide-react';

export const AddExpenseModal: React.FC = () => {
  const {
    isAddExpenseModalOpen,
    setIsAddExpenseModalOpen,
    addExpense,
    editExpense,
    editingExpense,
    setEditingExpense,
  } = useBudget();

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<CategoryName>('Food');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
    } else {
      setAmount('');
      setDescription('');
      setCategory('Food');
      setDate('25 Aug');
    }
  }, [editingExpense, isAddExpenseModalOpen]);

  const handleClose = () => {
    setIsAddExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!description.trim()) return;

    if (editingExpense) {
      editExpense(editingExpense.id, {
        amount: numAmount,
        description: description.trim(),
        category,
        date: date || 'Today',
      });
    } else {
      addExpense({
        amount: numAmount,
        description: description.trim(),
        category,
        date: date || 'Today',
      });
    }
    handleClose();
  };

  const categories: CategoryName[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Education'];

  return (
    <Modal
      isOpen={isAddExpenseModalOpen}
      onClose={handleClose}
      title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Amount (₹)
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <input
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 250"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Description
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. College Canteen Lunch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Category
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Tag className="w-5 h-5" />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryName)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white transition-colors appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Date
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="e.g. Today or 25 Aug"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all"
          >
            {editingExpense ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
