-- ==============================================================================
-- SPENDWISE DATABASE SCHEMA MIGRATION
-- Tables: profiles, budget_plan (singular), expenses, budget_categories,
--         savings_goals, savings_contributions, monthly_savings_plans
-- Security: Row Level Security (RLS) enabled on all tables with strict policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- A. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Automatic trigger for user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- B. BUDGET_PLAN TABLE (EXACT SINGULAR NAME)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budget_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_budget NUMERIC NOT NULL CHECK (total_budget >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT budget_plan_user_month_key UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budget_plan_user_month ON public.budget_plan(user_id, month);

ALTER TABLE public.budget_plan ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_plan' AND policyname = 'Users can view own budget plans'
  ) THEN
    CREATE POLICY "Users can view own budget plans"
      ON public.budget_plan FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_plan' AND policyname = 'Users can insert own budget plans'
  ) THEN
    CREATE POLICY "Users can insert own budget plans"
      ON public.budget_plan FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_plan' AND policyname = 'Users can update own budget plans'
  ) THEN
    CREATE POLICY "Users can update own budget plans"
      ON public.budget_plan FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_plan' AND policyname = 'Users can delete own budget plans'
  ) THEN
    CREATE POLICY "Users can delete own budget plans"
      ON public.budget_plan FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- C. BUDGET_CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_plan_id UUID NOT NULL REFERENCES public.budget_plan(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  allocated_amount NUMERIC NOT NULL CHECK (allocated_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT budget_categories_plan_category_key UNIQUE (budget_plan_id, category)
);

CREATE INDEX IF NOT EXISTS idx_budget_categories_plan ON public.budget_categories(budget_plan_id);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_categories' AND policyname = 'Users can view own budget categories'
  ) THEN
    CREATE POLICY "Users can view own budget categories"
      ON public.budget_categories FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = budget_categories.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_categories' AND policyname = 'Users can insert own budget categories'
  ) THEN
    CREATE POLICY "Users can insert own budget categories"
      ON public.budget_categories FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = budget_categories.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_categories' AND policyname = 'Users can update own budget categories'
  ) THEN
    CREATE POLICY "Users can update own budget categories"
      ON public.budget_categories FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = budget_categories.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = budget_categories.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'budget_categories' AND policyname = 'Users can delete own budget categories'
  ) THEN
    CREATE POLICY "Users can delete own budget categories"
      ON public.budget_categories FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = budget_categories.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- D. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_plan_id UUID NOT NULL REFERENCES public.budget_plan(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_plan ON public.expenses(user_id, budget_plan_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view own expenses'
  ) THEN
    CREATE POLICY "Users can view own expenses"
      ON public.expenses FOR SELECT
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = expenses.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert own expenses'
  ) THEN
    CREATE POLICY "Users can insert own expenses"
      ON public.expenses FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = expenses.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update own expenses'
  ) THEN
    CREATE POLICY "Users can update own expenses"
      ON public.expenses FOR UPDATE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = expenses.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = expenses.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can delete own expenses'
  ) THEN
    CREATE POLICY "Users can delete own expenses"
      ON public.expenses FOR DELETE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.budget_plan
          WHERE budget_plan.id = expenses.budget_plan_id
            AND budget_plan.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- E. SAVINGS_GOALS TABLE (Serves Future Purchases and Savings Goals)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  target_date DATE,
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  icon TEXT DEFAULT 'Tag',
  monthly_contribution NUMERIC DEFAULT 0 CHECK (monthly_contribution >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_goals' AND policyname = 'Users can view own savings goals'
  ) THEN
    CREATE POLICY "Users can view own savings goals"
      ON public.savings_goals FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_goals' AND policyname = 'Users can insert own savings goals'
  ) THEN
    CREATE POLICY "Users can insert own savings goals"
      ON public.savings_goals FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_goals' AND policyname = 'Users can update own savings goals'
  ) THEN
    CREATE POLICY "Users can update own savings goals"
      ON public.savings_goals FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_goals' AND policyname = 'Users can delete own savings goals'
  ) THEN
    CREATE POLICY "Users can delete own savings goals"
      ON public.savings_goals FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- F. SAVINGS_CONTRIBUTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal ON public.savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_user ON public.savings_contributions(user_id);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_contributions' AND policyname = 'Users can view own savings contributions'
  ) THEN
    CREATE POLICY "Users can view own savings contributions"
      ON public.savings_contributions FOR SELECT
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.savings_goals
          WHERE savings_goals.id = savings_contributions.goal_id
            AND savings_goals.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_contributions' AND policyname = 'Users can insert own savings contributions'
  ) THEN
    CREATE POLICY "Users can insert own savings contributions"
      ON public.savings_contributions FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.savings_goals
          WHERE savings_goals.id = savings_contributions.goal_id
            AND savings_goals.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'savings_contributions' AND policyname = 'Users can delete own savings contributions'
  ) THEN
    CREATE POLICY "Users can delete own savings contributions"
      ON public.savings_contributions FOR DELETE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.savings_goals
          WHERE savings_goals.id = savings_contributions.goal_id
            AND savings_goals.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- G. MONTHLY_SAVINGS_PLANS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_savings_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  planned_amount NUMERIC NOT NULL CHECK (planned_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT monthly_savings_plans_user_month_key UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_savings_plans_user ON public.monthly_savings_plans(user_id, month);

ALTER TABLE public.monthly_savings_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_savings_plans' AND policyname = 'Users can view own monthly savings plans'
  ) THEN
    CREATE POLICY "Users can view own monthly savings plans"
      ON public.monthly_savings_plans FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_savings_plans' AND policyname = 'Users can insert own monthly savings plans'
  ) THEN
    CREATE POLICY "Users can insert own monthly savings plans"
      ON public.monthly_savings_plans FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_savings_plans' AND policyname = 'Users can update own monthly savings plans'
  ) THEN
    CREATE POLICY "Users can update own monthly savings plans"
      ON public.monthly_savings_plans FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_savings_plans' AND policyname = 'Users can delete own monthly savings plans'
  ) THEN
    CREATE POLICY "Users can delete own monthly savings plans"
      ON public.monthly_savings_plans FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
