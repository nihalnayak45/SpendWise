import React, { useState, useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Insight } from '../types/budget';
import {
  Lightbulb,
  Target,
  AlertTriangle,
  Coins,
  Sparkles,
  Send,
  ArrowRight,
  MessageSquareQuote,
  Loader2,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const Insights: React.FC = () => {
  const {
    setCurrentPage,
    categoryAllocations,
    monthlyBudget,
    totalSpent,
    futurePurchases,
    selectedMonth,
  } = useBudget();
  const { profile, user, session } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Nihal';

  const [activeInsight, setActiveInsight] = useState<Insight | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'ai'; text: string; details?: { title: string; subtitle: string } }[]
  >([
    {
      sender: 'ai',
      text: `Hello ${displayName}! I'm your SpendWise Financial Assistant. Select a suggestion below or ask any question about your budget.`,
    },
  ]);

  // Dynamically calculate insights based on actual database records
  const dynamicInsights: Insight[] = useMemo(() => {
    const list: Insight[] = [];

    // 1. Over-budget category warning
    const overCategories = categoryAllocations.filter((c) => c.spent > c.planned && c.planned > 0);
    if (overCategories.length > 0) {
      const highestOver = overCategories.reduce((max, c) => (c.spent - c.planned > max.spent - max.planned ? c : max));
      const overAmount = highestOver.spent - highestOver.planned;
      const pctOver = Math.round((overAmount / highestOver.planned) * 100);

      list.push({
        id: 'ins-over-cat',
        type: 'warning',
        title: `${highestOver.name} spending is ${pctOver}% higher than planned`,
        description: `Your ${highestOver.name} expenses total ₹${highestOver.spent.toLocaleString('en-IN')} against your ₹${highestOver.planned.toLocaleString('en-IN')} planned allocation.`,
        category: `${highestOver.name} & Dining`,
        recommendation: `Consider limiting non-essential ${highestOver.name.toLowerCase()} purchases to save ₹${overAmount.toLocaleString('en-IN')}.`,
      });
    }

    // 2. Goal tracking insight
    if (futurePurchases.length > 0) {
      const primaryGoal = futurePurchases[0];
      const progress = Math.round((primaryGoal.saved / Math.max(1, primaryGoal.cost)) * 100);
      list.push({
        id: 'ins-goal-progress',
        type: 'success',
        title: `${primaryGoal.title} Goal Progress`,
        description: `With ₹${primaryGoal.saved.toLocaleString('en-IN')} saved out of ₹${primaryGoal.cost.toLocaleString('en-IN')} (${progress}%), your target completion date is ${primaryGoal.targetDate}.`,
        category: 'Savings Goals',
        recommendation: `Maintain your current ₹${primaryGoal.monthlyContribution.toLocaleString('en-IN')}/month contribution in the Budget Planner.`,
      });
    }

    // 3. Overall budget health insight
    if (monthlyBudget > 0) {
      const remaining = monthlyBudget - totalSpent;
      if (totalSpent > monthlyBudget) {
        list.push({
          id: 'ins-budget-exceeded',
          type: 'warning',
          title: 'Monthly Budget Limit Exceeded',
          description: `Total actual expenses have crossed your monthly budget by ₹${(totalSpent - monthlyBudget).toLocaleString('en-IN')}.`,
          category: 'Budget Health',
          recommendation: 'Use the What-If Simulator to find areas where you can trim discretionary spending.',
        });
      } else {
        const spentPct = Math.round((totalSpent / monthlyBudget) * 100);
        list.push({
          id: 'ins-budget-ontrack',
          type: 'info',
          title: `Budget is Healthy (${spentPct}% spent)`,
          description: `You have ₹${remaining.toLocaleString('en-IN')} remaining of your ₹${monthlyBudget.toLocaleString('en-IN')} monthly allowance.`,
          category: 'Monthly Status',
          recommendation: 'Allocate your surplus unallocated funds toward upcoming future purchase goals.',
        });
      }
    }

    // 4. Optimization tip
    const shoppingCat = categoryAllocations.find((c) => c.name === 'Shopping');
    if (shoppingCat && shoppingCat.planned > 1000) {
      list.push({
        id: 'ins-shopping-opt',
        type: 'tip',
        title: 'Optimize Shopping for Faster Goal Completion',
        description: `Trimming ₹500 from your ₹${shoppingCat.planned.toLocaleString('en-IN')} Shopping allocation frees up ₹500 extra monthly for savings.`,
        category: 'Optimization',
        recommendation: 'Reallocate ₹500 from Shopping to Savings in your Budget Planner.',
      });
    } else {
      list.push({
        id: 'ins-tip-general',
        type: 'tip',
        title: 'Emergency Cushion Strategy',
        description: 'Keeping at least 15% of your monthly funds unallocated protects you from unexpected expenses.',
        category: 'Financial Best Practice',
        recommendation: 'Review your budget allocations at the beginning of each week.',
      });
    }

    return list;
  }, [categoryAllocations, monthlyBudget, totalSpent, futurePurchases]);

  const handleAskQuestion = async (queryText: string) => {
    if (!queryText.trim() || isAiLoading) return;

    const currentQuery = queryText.trim();
    setChatQuery('');

    // Append user message immediately
    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: currentQuery }];
    setChatHistory(updatedHistory);
    setIsAiLoading(true);

    try {
      // Ensure we have the latest active session token directly from Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token || session?.access_token;

      if (!token) {
        setChatHistory([
          ...updatedHistory,
          {
            sender: 'ai',
            text: 'Please sign in to access personalized financial insights and AI chat.',
          },
        ]);
        return;
      }

      let response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: currentQuery,
          history: updatedHistory.slice(-5),
          month: selectedMonth,
        }),
      });

      // If token expired, attempt refresh once
      if (response.status === 401) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session?.access_token) {
          token = refreshData.session.access_token;
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: currentQuery,
              history: updatedHistory.slice(-5),
              month: selectedMonth,
            }),
          });
        }
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Chat API error:', {
          status: response.status,
          body: errorBody,
        });
        throw new Error(
          `Server returned ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const data = await response.json();

      setChatHistory([
        ...updatedHistory,
        {
          sender: 'ai',
          text: data.text || 'I processed your query based on your current budget records.',
          details: data.details,
        },
      ]);
    } catch (err: unknown) {
      console.error('AI chat error:', err);

      let errorMsg = 'Failed to get a response from SpendWise Assistant.';
      if (err instanceof Error) {
        errorMsg = err.message;
        try {
          const match = errorMsg.match(/Server returned \d+: (\{.*\})/);
          if (match) {
            const parsed = JSON.parse(match[1]);
            errorMsg = parsed.message || parsed.error || errorMsg;
          }
        } catch {
          // ignore json parse error
        }
      }

      setChatHistory([
        ...updatedHistory,
        {
          sender: 'ai',
          text: `⚠️ ${errorMsg}`,
          details: { title: 'Assistant Service Notice', subtitle: 'Please retry or verify credentials' },
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Spending Insights</h2>
          <p className="text-xs text-slate-500 font-medium">
            Personalized decision-support recommendations powered by your real financial records
          </p>
        </div>
      </div>

      {/* INSIGHT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dynamicInsights.map((ins) => (
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
            <p className="text-xs text-slate-500 font-medium">Instant financial decision advice grounded in your real accounts</p>
          </div>
        </div>

        {/* Suggested Quick Question Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            'Can I afford a ₹5,000 purchase?',
            'Where am I spending the most?',
            'How can I save ₹2,000 this month?',
            'When will I reach my laptop goal?',
          ].map((promptText) => (
            <button
              key={promptText}
              disabled={isAiLoading}
              onClick={() => handleAskQuestion(promptText)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-700 text-xs font-semibold border border-slate-200 whitespace-nowrap transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-teal-600" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 max-h-80 overflow-y-auto">
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

          {isAiLoading && (
            <div className="flex items-start">
              <div className="p-3 bg-white text-slate-600 border border-slate-200 shadow-sm rounded-2xl rounded-bl-none text-xs flex items-center gap-2 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Analyzing your financial context...</span>
              </div>
            </div>
          )}
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
            placeholder="Ask something about your budget, spending trends, or savings goals..."
            value={chatQuery}
            disabled={isAiLoading}
            onChange={(e) => setChatQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAiLoading || !chatQuery.trim()}
            className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center"
            aria-label="Send query"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
