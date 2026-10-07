import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import type { Insight } from '../types/budget';
import { Lightbulb, Target, AlertTriangle, Coins, Sparkles, Send, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const Insights: React.FC = () => {
  const { setCurrentPage } = useBudget();

  const [activeInsight, setActiveInsight] = useState<Insight | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'ai'; text: string; details?: { title: string; subtitle: string } }[]
  >([
    {
      sender: 'ai',
      text: "Hello Nihal! I'm your SpendWise Financial Assistant. Select a suggestion below or ask any question about your budget.",
    },
  ]);

  const insightsList: Insight[] = [
    {
      id: 'ins-1',
      type: 'warning',
      title: 'Food spending is 12% higher than planned',
      description: 'Your canteen and Swiggy expenses total ₹3,650 against your ₹4,000 baseline budget halfway through the month.',
      category: 'Food & Dining',
      recommendation: 'Try cooking 2 meals at hostel or limiting weekend food orders to save ₹600.',
    },
    {
      id: 'ins-2',
      type: 'success',
      title: 'Laptop Goal on Track',
      description: 'With ₹27,000 saved out of ₹60,000 and ₹5,000/month contributions, you are set to hit your target by December 2026.',
      category: 'Savings Goals',
      recommendation: 'Maintain your current ₹5,000 allocation in the Budget Planner.',
    },
    {
      id: 'ins-3',
      type: 'info',
      title: 'Weekend spending spike detected',
      description: '68% of your discretionary entertainment and shopping expenses occur between Friday evening and Sunday night.',
      category: 'Behavioral Insights',
      recommendation: 'Set a weekend pocket-money limit of ₹1,000 to keep impulses in check.',
    },
    {
      id: 'ins-4',
      type: 'tip',
      title: 'Cut Entertainment by ₹500 for faster laptop goal',
      description: 'Reducing movie subscriptions and outings from ₹1,000 to ₹500 frees up ₹500 extra per month.',
      category: 'Optimization',
      recommendation: 'Reallocate ₹500 from Entertainment to Savings in your Budget Planner.',
    },
  ];

  const handleAskQuestion = (queryText: string) => {
    if (!queryText.trim()) return;

    const newChat = [...chatHistory, { sender: 'user' as const, text: queryText }];
    setChatQuery('');

    let aiReply = "Based on your ₹15,000 budget, you're currently in a safe financial position with ₹7,750 remaining balance.";
    let subDetails = undefined;

    if (queryText.includes('5,000') || queryText.includes('afford')) {
      aiReply = "Yes, you can afford a ₹5,000 purchase right now, but it will consume 64% of your remaining ₹7,750 balance and shift your Laptop goal by 1 month.";
      subDetails = { title: 'Impact Assessment', subtitle: 'Consider using the What-If Simulator to test before buying.' };
    } else if (queryText.includes('2,000') || queryText.includes('save')) {
      aiReply = "To save an extra ₹2,000 this month, reduce Food expenses by ₹1,000, Shopping by ₹500, and Entertainment by ₹500.";
      subDetails = { title: 'Suggested Reallocation Plan', subtitle: 'Apply in Budget Planner' };
    } else if (queryText.includes('laptop') || queryText.includes('goal')) {
      aiReply = "You are currently scheduled to complete your Laptop target by December 2026. Increasing monthly savings by ₹1,000 advances target date to November 2026.";
      subDetails = { title: 'Target Date', subtitle: 'December 2026 (50% saved)' };
    }

    setChatHistory([...newChat, { sender: 'ai', text: aiReply, details: subDetails }]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Spending Insights</h2>
          <p className="text-xs text-slate-500 font-medium">
            Personalized decision-support recommendations powered by mock financial intelligence
          </p>
        </div>
      </div>

      {/* INSIGHT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insightsList.map((ins) => (
          <div
            key={ins.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {ins.category}
                </span>
                {ins.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {ins.type === 'success' && <Target className="w-4 h-4 text-emerald-500" />}
                {ins.type === 'info' && <Lightbulb className="w-4 h-4 text-sky-500" />}
                {ins.type === 'tip' && <Coins className="w-4 h-4 text-teal-600" />}
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">{ins.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{ins.description}</p>
            </div>

            <button
              onClick={() => setActiveInsight(ins)}
              className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-teal-700 font-bold text-xs border border-slate-200/70 transition-colors flex items-center justify-center gap-1.5 self-start"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* AI ASSISTANT SECTION: ASK SPENDWISE */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Ask SpendWise Assistant</h3>
            <p className="text-xs text-slate-500 font-medium">Instant financial decision advice and query breakdown</p>
          </div>
        </div>

        {/* Suggested Quick Question Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            'Can I afford a ₹5,000 purchase?',
            'How can I save ₹2,000 this month?',
            'When will I reach my laptop goal?',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleAskQuestion(promptText)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-700 text-xs font-semibold border border-slate-200 whitespace-nowrap transition-colors flex items-center gap-1.5"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-teal-600" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 max-h-72 overflow-y-auto">
          {chatHistory.map((chat, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                  chat.sender === 'user'
                    ? 'bg-slate-900 text-white font-semibold rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none font-medium'
                }`}
              >
                {chat.text}

                {chat.details && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] bg-slate-50 p-2 rounded-lg">
                    <span className="font-bold text-teal-700 block">{chat.details.title}</span>
                    <span className="text-slate-500">{chat.details.subtitle}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(chatQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask something about your budget..."
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20 transition-all"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* EXPLORE DETAIL MODAL */}
      {activeInsight && (
        <Modal isOpen={!!activeInsight} onClose={() => setActiveInsight(null)} title={activeInsight.title}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 block">Analysis:</span>
              <p className="text-slate-600 leading-relaxed">{activeInsight.description}</p>
            </div>

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-900 space-y-1">
              <span className="font-bold block">Recommended Action:</span>
              <p className="font-semibold leading-relaxed">{activeInsight.recommendation}</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveInsight(null);
                  setCurrentPage('planner');
                }}
                className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors"
              >
                Go to Budget Planner
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
