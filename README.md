# SpendWise — Personal Budget & Decision Support

SpendWise is an interactive financial decision-support and budget management application tailored for students and young professionals. It combines real-time budget tracking, direct-manipulation sliders, a What-If scenario sandbox, and grounded AI chat assistance.

---

## Architecture Overview

- **Frontend**: Vite 8 + React 19 + TypeScript + Tailwind CSS v3 + Lucide Icons + Recharts
  - Supabase client integration (`@supabase/supabase-js`)
  - Authentication & protected routing (`AuthContext`)
  - Real database CRUD for budgets, categories, expenses, goals, and contributions (`BudgetContext`)
  - Visual What-If simulator (client-side sandbox with zero unwanted database writes)
- **Backend Service**: Express + TypeScript + Node.js (Port 5000)
  - JWT token verification via Supabase Auth
  - Grounded financial context calculator
  - Multi-provider AI assistant adapter (Google Gemini / OpenAI / Rule-based verified fallback)
- **Database**: PostgreSQL on Supabase
  - Tables: `profiles`, `budget_plan` (singular), `budget_categories`, `expenses`, `savings_goals`, `savings_contributions`, `monthly_savings_plans`
  - Strict Row-Level Security (RLS) on all tables

---

## Quick Setup Guide

### 1. Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** in your Supabase project.
3. Open and run the migration script [`supabase_schema.sql`](./supabase_schema.sql).
4. The migration will create:
   - All 7 database tables with UUID primary keys, foreign keys, timestamps, and indexes.
   - `budget_plan` (exact singular name) with `UNIQUE(user_id, month)`.
   - Automatic user profile creation trigger on signup (`public.handle_new_user`).
   - Strict Row-Level Security (RLS) policies isolating user data.

### 2. Environment Variables Configuration

#### Frontend (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
# Optional service role key for backend-privileged token operations:
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider API Key (Google Gemini or OpenAI):
GEMINI_API_KEY=your-gemini-api-key
# or OPENAI_API_KEY=your-openai-api-key
```

---

## Running the Application

### Start Backend Service:
```bash
cd backend
npm run dev
```
Runs at `http://localhost:5000`.

### Start Frontend Application:
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:5173`. Calls to `/api/*` are automatically proxied to `http://localhost:5000`.

---

## Verification & Key Flows

1. **Authentication**:
   - Access `http://localhost:5173/`. Unauthenticated users are directed to the Auth view.
   - Switch between **Sign In** and **Create Account**.
   - Input validation (email format, 6+ character password, password visibility toggle).
   - Handles email confirmation if enabled in Supabase project.
2. **Dashboard**:
   - Monthly budget, total spent, remaining balance, and dynamic health score.
   - Spending overview bar chart and planned vs. actual progress.
   - Clean empty states when starting fresh.
3. **Expenses**:
   - Add, edit, and delete real transactions.
   - Instant re-calculation of budget totals and category breakdowns.
4. **Budget Planner**:
   - Interactive sliders to allocate funds across categories.
   - Real-time over-budget warning banner.
   - Persists allocations to `budget_categories` and `budget_plan`.
5. **Future Purchases & Savings Goals**:
   - Unified goals model backed by `savings_goals`.
   - Record real savings contributions to `savings_contributions`.
   - Dynamic recalculation of completion timelines.
6. **What-If Simulator**:
   - Sandbox testing for purchases, spending boosts, and savings rate changes.
   - Zero database mutations while simulating; only applies upon explicit confirmation.
7. **AI Assistant**:
   - Access from Insights page (`/insights`).
   - Secure server-side call authenticated with user's Supabase JWT.
   - Grounded strictly in the user's real financial numbers.
