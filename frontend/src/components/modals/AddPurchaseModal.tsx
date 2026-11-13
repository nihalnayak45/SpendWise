import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Modal } from '../common/Modal';
import { IconMapper } from '../common/IconMapper';
import type { Priority } from '../../types/budget';
import { ShoppingBag, IndianRupee, Calendar, Flag, Sparkles } from 'lucide-react';

const POPULAR_GOAL_ICONS = [
  'Laptop',
  'Smartphone',
  'Headphones',
  'Car',
  'Bike',
  'Plane',
  'GraduationCap',
  'Home',
  'Watch',
  'Camera',
  'Tv',
  'Gamepad2',
  'Gift',
  'ShoppingBag',
  'Tag',
];

export const AddPurchaseModal: React.FC = () => {
  const { isAddPurchaseModalOpen, setIsAddPurchaseModalOpen, addFuturePurchase, addToast } = useBudget();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const todayDateStr = `${currentYear}-${currentMonthStr}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthValue = `${currentYear}-${currentMonthStr}`;

  // Default to 6 months in future for standard savings timeline
  const futureDate = new Date(now.getFullYear(), now.getMonth() + 6, 1);
  const defaultFutureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [dateMode, setDateMode] = useState<'month' | 'exact'>('month');
  const [monthValue, setMonthValue] = useState(defaultFutureMonth);
  const [exactDateValue, setExactDateValue] = useState(`${defaultFutureMonth}-01`);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [selectedIcon, setSelectedIcon] = useState('Laptop');

  const handleClose = () => {
    setIsAddPurchaseModalOpen(false);
    setTitle('');
    setCost('');
    setSelectedIcon('Laptop');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numCost = parseFloat(cost);
    if (!title.trim()) {
      addToast('error', 'Title Required', 'Please enter a goal title.');
      return;
    }
    if (isNaN(numCost) || numCost <= 0) {
      addToast('error', 'Invalid Amount', 'Estimated cost must be greater than zero.');
      return;
    }

    let targetDateDb: string;
    if (dateMode === 'month') {
      if (!monthValue) {
        addToast('error', 'Date Required', 'Please select a valid target month.');
        return;
      }
      targetDateDb = `${monthValue}-01`;
    } else {
      if (!exactDateValue) {
        addToast('error', 'Date Required', 'Please select a valid target date.');
        return;
      }
      targetDateDb = exactDateValue;
    }

    if (targetDateDb < todayDateStr) {
      addToast('error', 'Invalid Date', 'Target date cannot be in the past for new purchase goals.');
      return;
    }

    addFuturePurchase({
      title: title.trim(),
      cost: numCost,
      targetDate: targetDateDb,
      priority,
      icon: selectedIcon,
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
              placeholder="e.g. MacBook Pro M3 or Gaming Console"
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

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Choose Goal Icon
          </label>
          <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
            {POPULAR_GOAL_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  selectedIcon === iconName
                    ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-300'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
                title={iconName}
              >
                <IconMapper name={iconName} className="w-5 h-5" />
                <span className="text-[9px] font-semibold mt-1 truncate max-w-full">{iconName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Date Mode & Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Target Date
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setDateMode('month')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  dateMode === 'month' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Month & Year
              </button>
              <button
                type="button"
                onClick={() => setDateMode('exact')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  dateMode === 'exact' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Exact Date
              </button>
            </div>
          </div>

          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            {dateMode === 'month' ? (
              <input
                type="month"
                min={currentMonthValue}
                required
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white transition-colors"
              />
            ) : (
              <input
                type="date"
                min={todayDateStr}
                required
                value={exactDateValue}
                onChange={(e) => setExactDateValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white transition-colors"
              />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {dateMode === 'month'
              ? 'Stored as YYYY-MM-01 in Supabase and displayed cleanly as Month Year.'
              : 'Stored as exact YYYY-MM-DD in Supabase.'}
          </p>
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
            className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all active:scale-95"
          >
            Save Purchase Goal
          </button>
        </div>
      </form>
    </Modal>
  );
};
