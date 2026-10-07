import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Modal } from '../common/Modal';
import type { Priority } from '../../types/budget';
import { ShoppingBag, IndianRupee, Calendar, Flag } from 'lucide-react';

export const AddPurchaseModal: React.FC = () => {
  const { isAddPurchaseModalOpen, setIsAddPurchaseModalOpen, addFuturePurchase } = useBudget();

  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [targetDate, setTargetDate] = useState('December 2026');
  const [priority, setPriority] = useState<Priority>('Medium');

  const handleClose = () => {
    setIsAddPurchaseModalOpen(false);
    setTitle('');
    setCost('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numCost = parseFloat(cost);
    if (!title.trim() || isNaN(numCost) || numCost <= 0) return;

    addFuturePurchase({
      title: title.trim(),
      cost: numCost,
      targetDate: targetDate || 'December 2026',
      priority,
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isAddPurchaseModalOpen}
      onClose={handleClose}
      title="Plan New Future Purchase"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            What do you want to buy?
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Gaming Console or Laptop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Estimated Cost */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Estimated Cost (₹)
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 60000"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Target Date
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. December 2026"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Priority
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Flag className="w-5 h-5" />
            </div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white transition-colors appearance-none"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

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
            Save Purchase Goal
          </button>
        </div>
      </form>
    </Modal>
  );
};
