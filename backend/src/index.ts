import './config/env.js';
import express from 'express';
import cors from 'cors';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth.js';
import { getUserFinancialContext } from './services/financialContext.js';
import { generateFinancialAdvice } from './services/aiAdapter.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SpendWise Backend API',
    timestamp: new Date().toISOString(),
    aiProviderConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL),
  });
});

// Authenticated AI Chat Endpoint
app.post('/api/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { query, history, month } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    // 1. Fetch authorized financial data for this specific user (scoped to user session)
    const financialContext = await getUserFinancialContext(userId, month, req.token);

    // 2. Generate grounded response with AI adapter
    const aiResult = await generateFinancialAdvice(
      query.trim(),
      Array.isArray(history) ? history : [],
      financialContext
    );

    res.json({
      text: aiResult.reply,
      details: aiResult.details,
      provider: aiResult.providerUsed,
      contextMonth: financialContext.monthString,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: errorMsg,
    });
  }
});

// Authenticated Financial Summary Endpoint
app.get('/api/financial-summary', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const summary = await getUserFinancialContext(userId, month, req.token);
    res.json(summary);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: errorMsg });
  }
});

app.listen(port, () => {
  console.log(`🚀 SpendWise Backend running on http://localhost:${port}`);
});
