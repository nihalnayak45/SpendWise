import { GoogleGenerativeAI } from '@google/generative-ai';
import type { UserFinancialSummary } from './financialContext.js';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface ChatResponse {
  reply: string;
  details?: {
    title: string;
    subtitle: string;
  };
  providerUsed: 'gemini' | 'openai' | 'fallback';
}

export async function generateFinancialAdvice(
  userQuery: string,
  history: ChatMessage[],
  financialContext: UserFinancialSummary
): Promise<ChatResponse> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const isGeminiConfigured = Boolean(
    geminiApiKey &&
    !geminiApiKey.startsWith('your-') &&
    !geminiApiKey.includes('placeholder')
  );

  // If user has no records entered yet, inform them directly without generating hallucinations
  if (!financialContext.hasData) {
    return {
      reply: `Hello${financialContext.userProfile.fullName ? ` ${financialContext.userProfile.fullName}` : ''}! Welcome to SpendWise. You don't have any financial records entered for ${financialContext.monthString} yet. Head over to the Budget Planner to set your monthly budget or log your first expense, and I will provide personalized advice.`,
      details: { title: 'No Data Yet', subtitle: 'Add budget or expenses to receive AI analysis' },
      providerUsed: 'fallback',
    };
  }

  // Grounded financial context description
  const contextDescription = `
USER'S AUTHENTICATED PROFILE & FINANCIAL DATA (Month: ${financialContext.monthString}):
- User Name: ${financialContext.userProfile.fullName || 'User'}
- Currency: Indian Rupees (₹)
- Monthly Budget: ₹${financialContext.monthlyBudget.toLocaleString('en-IN')}
- Total Allocated Budget: ₹${financialContext.totalAllocatedBudget.toLocaleString('en-IN')}
- Remaining Unallocated Budget: ₹${financialContext.unallocatedBudget.toLocaleString('en-IN')}
- Total Spent This Month: ₹${financialContext.totalSpent.toLocaleString('en-IN')}
- Remaining Available Balance: ₹${financialContext.remainingBudget.toLocaleString('en-IN')}
- Overall Budget Usage: ${financialContext.budgetUsagePercent}%
- Top Spending Category: ${financialContext.topSpendingCategory || 'None'}
- Planned Monthly Savings: ₹${financialContext.plannedMonthlySavings.toLocaleString('en-IN')}

PLANNED CATEGORY ALLOCATIONS VS ACTUAL SPENT:
${financialContext.categoryBreakdown.length > 0 
  ? financialContext.categoryBreakdown
      .map(c => `  * ${c.category}: Planned ₹${c.planned.toLocaleString('en-IN')} | Actual Spent ₹${c.spent.toLocaleString('en-IN')} (${c.percentageSpent}% spent, ${c.isOverBudget ? 'OVER BUDGET by ₹' + Math.abs(c.difference) : 'Remaining ₹' + c.difference})`)
      .join('\n')
  : '  * No category allocations configured yet.'}

RECENT TRANSACTIONS:
${financialContext.recentExpenses.length > 0
  ? financialContext.recentExpenses
      .map(e => `  * ${e.date}: ₹${e.amount.toLocaleString('en-IN')} on ${e.description} (${e.category})`)
      .join('\n')
  : '  * No recent expenses recorded.'}

MULTI-MONTH SPENDING TRENDS:
${financialContext.monthlyTrends.length > 0
  ? financialContext.monthlyTrends
      .map(m => `  * Month ${m.month}: Budget ₹${m.totalBudget.toLocaleString('en-IN')} | Total Spent ₹${m.totalSpent.toLocaleString('en-IN')}`)
      .join('\n')
  : '  * Only current month recorded.'}

SAVINGS GOALS & FUTURE PURCHASES (Calculated from actual contributions):
${financialContext.savingsGoals.length > 0
  ? financialContext.savingsGoals
      .map(g => `  * "${g.title}" [${g.priority} Priority, Status: ${g.status}]: Saved ₹${g.savedSoFar.toLocaleString('en-IN')} / Target ₹${g.targetAmount.toLocaleString('en-IN')} (${g.progressPercent}%). Remaining: ₹${g.remainingAmount.toLocaleString('en-IN')}. Monthly Contribution: ₹${g.monthlyContribution.toLocaleString('en-IN')}. Target Date: ${g.targetDate || 'TBD'}`)
      .join('\n')
  : '  * No savings goals created yet.'}
`;

  const systemInstruction = `
You are the SpendWise AI Financial Assistant, embedded inside the SpendWise budget and decision support web application.
Your role is to offer clear, actionable, empathetic, and strictly grounded financial advice to help college students and young professionals manage their money.

CRITICAL RULES:
1. Grounding: Rely ONLY on the exact financial data provided above. NEVER invent or assume numbers, bank balances, or transactions that are not listed.
2. If data for a specific category or goal is not present, clearly state that it is not recorded.
3. Currency: Always use Indian Rupees (₹) for all monetary amounts.
4. Affordability queries (e.g. "Can I afford ₹X?"): Calculate directly against the remaining available budget (₹${financialContext.remainingBudget.toLocaleString('en-IN')}) and savings goals. Explain what percentage of remaining balance it consumes and impact on planned targets.
5. Spending reduction queries: Suggest specific cuts from categories that are over-budget or non-essential (Shopping, Entertainment, Food).
6. Goal timeline queries: Use the remaining cost and monthly contribution rate to calculate completion timelines clearly.
7. Follow-up understanding: The user may ask follow-up questions referencing previous answers (e.g. "How can I reduce it?"). Use the conversation history to understand context.
8. Tone: Concise, direct, encouraging, and structured. Keep answers between 2 to 4 impactful sentences, followed by one actionable recommendation.
`;

  // 1. Primary: Google Gemini with dynamic candidate fallback
  if (isGeminiConfigured) {
    const genAI = new GoogleGenerativeAI(geminiApiKey!);
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ].filter(Boolean) as string[];

    const prompt = `
System Instruction:
${systemInstruction}

Financial Context:
${contextDescription}

Recent conversation history:
${history.slice(-5).map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')}

User Question:
${userQuery}
`;

    let lastError: Error | null = null;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const reply = result.response.text();

        if (reply && reply.trim()) {
          // Determine appropriate card details badge
          let details: { title: string; subtitle: string } | undefined;
          if (userQuery.toLowerCase().includes('afford')) {
            details = {
              title: 'Affordability Analysis',
              subtitle: `Remaining Budget: ₹${financialContext.remainingBudget.toLocaleString('en-IN')}`,
            };
          } else if (userQuery.toLowerCase().includes('save') || userQuery.toLowerCase().includes('reduce')) {
            details = {
              title: 'Savings Optimization',
              subtitle: `Planned Monthly Savings: ₹${financialContext.plannedMonthlySavings.toLocaleString('en-IN')}`,
            };
          } else if (userQuery.toLowerCase().includes('goal') || userQuery.toLowerCase().includes('laptop') || userQuery.toLowerCase().includes('purchase')) {
            const primaryGoal = financialContext.savingsGoals[0];
            if (primaryGoal) {
              details = {
                title: `Goal: ${primaryGoal.title}`,
                subtitle: `${primaryGoal.progressPercent}% saved (${primaryGoal.status})`,
              };
            }
          }

          return {
            reply: reply.trim(),
            details,
            providerUsed: 'gemini',
          };
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Gemini model ${modelName} call failed:`, lastError.message);
        // If model not found or unavailable, try next candidate model
        if (
          lastError.message.includes('404') ||
          lastError.message.includes('not found') ||
          lastError.message.includes('no longer available')
        ) {
          continue;
        }
        // Non-404 error (e.g. rate limit / network)
        break;
      }
    }

    if (lastError) {
      if (lastError.message.includes('fetch failed') || lastError.message.includes('ENOTFOUND')) {
        throw new Error('Network error: Unable to connect to Gemini API. Please check internet connection.');
      }
      if (lastError.message.includes('429') || lastError.message.includes('quota')) {
        throw new Error('Gemini API rate limit or quota exceeded. Please wait a moment and retry.');
      }
      throw new Error(`Gemini API error: ${lastError.message}`);
    }
  }

  // If Gemini is not configured
  throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.');
}
