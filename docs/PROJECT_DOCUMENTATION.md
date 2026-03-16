# Legacy Life Builder — Full A–Z Project Documentation

> **Version:** 1.0  
> **Last Updated:** March 2025  
> **Purpose:** Complete technical reference for developers, security audit, and payment gateway integration.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Authentication](#3-authentication)
4. [Database](#4-database)
5. [Security](#5-security)
6. [Payment & Subscription Integration Plan](#6-payment--subscription-integration-plan)
7. [Environment & Deployment](#7-environment--deployment)

---

## 1. Project Overview

### 1.1 What It Is

**Legacy Life Builder** is a production-ready weekly planner application that helps users:

- Plan and track **goals** with AI-assisted action plans
- Build and maintain **habits** with recurring schedules
- Manage a **48-slot weekly planner** (7 days × time slots)
- View **Today** view with daily themes and task completion
- Track **statistics** and performance over time
- Manage **profile** (avatar, preferences, security)

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, TypeScript |
| **Styling** | Tailwind CSS v4, Radix UI, Framer Motion |
| **State** | TanStack React Query, Zustand |
| **Auth & DB** | Supabase (Auth + PostgreSQL + Storage) |
| **Routing** | React Router v7 |
| **Forms** | React Hook Form, Zod |

### 1.3 Key Directories

```
planner/
├── src/
│   ├── api/              # Supabase services, auth helpers
│   ├── components/       # Shared UI (button, input, dialogs)
│   ├── contexts/         # AuthProvider
│   ├── features/        # Auth, Goals, Habits, Planner, Today, Profile, Statistics
│   ├── layout/          # Header, sidebar, dashboard layout
│   ├── lib/              # supabaseClient, utils (cn)
│   ├── types/            # domain.ts, planner.ts, global-types
│   └── utils/            # week-utils, time-utils, color-utils, image-crop
├── database-schema.sql   # Full DB schema + RLS
├── docs/                 # Documentation
└── index.html
```

---

## 2. Architecture

### 2.1 Entry Flow

```
index.html → main.tsx (ThemeProvider) → App.tsx
  → QueryClientProvider
  → AuthProvider
  → RouterProvider
  → Routes (ProtectedRoute / AuthRoute)
```

### 2.2 Data Flow

- **Auth:** Supabase Auth → `AuthContext` → `useAuth()` → `ProtectedRoute` / pages
- **Data:** Supabase client → API services in `src/api/services/` → TanStack Query hooks
- **RLS:** Every Supabase query is filtered by `auth.uid() = user_id` at the database level

### 2.3 Route Structure

| Path | Protection | Description |
|------|------------|-------------|
| `/login` | AuthRoute (redirect if logged in) | Login page |
| `/signup` | AuthRoute | Signup page |
| `/forgot-password` | AuthRoute | Password reset request |
| `/reset-password` | Public | Password reset (token in URL) |
| `/` | ProtectedRoute | Today page |
| `/habits` | ProtectedRoute | Habits management |
| `/goals` | ProtectedRoute | Goals management |
| `/planner` | ProtectedRoute | Weekly planner |
| `/profile` | ProtectedRoute | Profile & security |
| `/statistics` | ProtectedRoute | Stats dashboard |

---

## 3. Authentication

### 3.1 Provider: Supabase Auth

- **Client:** `src/lib/supabaseClient.ts` — `createClient(supabaseUrl, supabaseAnonKey)`
- **Context:** `src/contexts/auth-context.tsx` — `AuthProvider` exposes `user`, `session`, `isLoading`, `signOut`

### 3.2 Auth Flows

#### Login (`src/features/auth/forms/login-form.tsx`)

1. **Email/Password:** `supabase.auth.signInWithPassword({ email, password })`
2. **Google OAuth:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
3. **Email not confirmed:** User can resend OTP → `onRequireOtp(email)` → OTP verification screen

#### Signup (`src/features/auth/forms/signup-form.tsx`)

1. **Validation:** Password ≥ 6 chars, passwords match
2. **Email/Password:** `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
3. **Result:**
   - If `data.session` exists → auto-confirmed → redirect to app
   - Else → email confirmation required → `onRequireOtp(email)`

#### OTP Verification (`src/features/auth/components/otp-verification.tsx`)

- 8-digit OTP via `verifyOtp` / `resend` for signup confirmation

#### Forgot Password (`src/features/auth/forms/forgot-password-form.tsx`)

- `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`

#### Reset Password (`src/features/auth/forms/reset-password-form.tsx`)

- Listens for `PASSWORD_RECOVERY` event → `supabase.auth.updateUser({ password })`

#### Personalize (`src/features/auth/forms/personalize-form.tsx`)

- For new users: sets `isPersonalized` in `user_profiles` and user metadata

### 3.3 Session Handling

```ts
// On mount
supabase.auth.getSession() → setSession, setUser, setIsLoading(false)

// Live updates
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session)
  setUser(session?.user ?? null)
  if (!session) queryClient.clear()
})

// Sign out
queryClient.clear()
supabase.auth.signOut()
```

### 3.4 Protected Routes

- **ProtectedRoute** (`src/components/protected-route.tsx`): Renders `<Outlet />` only if `user` exists; else redirects to `/login`
- **AuthRoute**: Redirects to `/` if user is logged in (used for login/signup)

### 3.5 Auth Helpers (`src/api/helpers/auth-helpers.ts`)

```ts
getCurrentUserId()   // Throws if not authenticated
getOptionalUserId()  // Returns null if not authenticated
```

Used by API services to ensure `user_id` is always set before DB operations.

---

## 4. Database

### 4.1 Schema Overview

All tables use `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` and **Row Level Security (RLS)**.

### 4.2 Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **user_profiles** | User preferences, DOB, sleep, week_start, plan times | `user_id` (UNIQUE), `full_name`, `dob`, `sleep_start`, `sleep_duration`, `week_start`, `plan_day`, `plan_start_time`, `plan_end_time`, `is_personalized` |
| **goals** | User goals with plans and milestones | `user_id`, `name`, `purpose`, `startDate`, `endDate`, `goalType`, `plans` (jsonb), `milestones` (jsonb) |
| **habits** | Recurring habits | `user_id`, `name`, `startTime`, `endTime`, `daysOfWeek` (jsonb) |
| **week_plans** | Weekly planner state | `user_id`, `week`, `state` (jsonb), UNIQUE(user_id, week) |
| **custom_tasks** | Task library | `user_id`, `name`, `startTime`, `endTime`, `daysOfWeek` (jsonb) |
| **completed_tasks** | Daily completion tracking | `user_id`, `dayStr`, `taskIds` (jsonb), UNIQUE(user_id, dayStr) |

### 4.3 RLS Policies

All tables have a single policy:

```sql
CREATE POLICY "Users can manage their own <table>" ON <table>
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- **USING:** Controls which rows can be read
- **WITH CHECK:** Controls which rows can be inserted/updated
- **Effect:** Users can only access their own data; no cross-user access

### 4.4 Storage

- **Bucket:** `avatars`
- **Path:** `{user_id}/avatar.jpg`
- **Usage:** Profile avatar upload (profile-info.tsx)
- **Validation:** 5 MB max, `image/jpeg`, `image/png`, `image/webp`
- **Note:** Bucket and RLS policies must be configured in Supabase Dashboard (not in `database-schema.sql`)

---

## 5. Security

### 5.1 Current Security Measures

| Area | Implementation |
|------|----------------|
| **Auth** | Supabase Auth (JWT, secure session) |
| **DB access** | RLS on all tables; `auth.uid() = user_id` |
| **API** | No custom backend; Supabase client uses JWT automatically |
| **Client-side** | `getCurrentUserId()` / `getOptionalUserId()` before queries |
| **File upload** | 5 MB limit, type whitelist (jpeg/png/webp) |
| **Password** | Min 6 chars (Supabase default); consider increasing for production |

### 5.2 Environment Variables (all in `.env`)

| Variable | Purpose | Required | Exposure |
|----------|---------|----------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | Client (public) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes | Client (public, safe by design) |
| `VITE_GEMINI_API_KEY` | AI API key (OpenRouter/Gemini) | No | **Client (exposed)** — move to backend for production |
| `VITE_AI_API_URL` | AI API base URL | No | Client (default: OpenRouter) |
| `VITE_AI_MODEL` | AI model identifier | No | Client (default: arcee-ai/trinity-large-preview:free) |

**Never commit `.env`** — it is in `.gitignore`. Use `.env.example` as a template.

### 5.3 Security Hardening for Payment Integration

To make the app **production-ready and resistant to abuse** before adding payments:

#### A. Move AI API Key to Backend

- **Current:** `VITE_GEMINI_API_KEY` is in the client → anyone can extract and abuse it
- **Fix:** Create a Supabase Edge Function or small backend that:
  - Accepts authenticated requests (JWT)
  - Validates user subscription status
  - Proxies AI requests with server-side API key

#### B. Add Subscription Table (for $1/month)

```sql
-- Add to database-schema.sql
CREATE TABLE subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inactive',  -- inactive, active, cancelled, past_due
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE only via service role (Stripe webhook)
```

#### C. Enforce Subscription on Protected Routes

- Add `subscription_status = 'active'` check in `ProtectedRoute` or a new `SubscriptionGate` component
- Redirect non-subscribers to `/subscribe` or `/pricing`

#### D. Rate Limiting (Supabase)

- Enable Supabase rate limiting in project settings
- Use Supabase Edge Functions for sensitive operations (e.g. AI, payment webhooks)

#### E. Secure Stripe Webhooks

- Verify webhook signature with `stripe.webhooks.constructEvent(payload, sig, secret)`
- Use Supabase Edge Function or separate backend; never expose webhook logic to client

#### F. CORS & Headers

- Configure Supabase project URL allowlist
- Use `Content-Security-Policy`, `X-Frame-Options` headers (via Vercel/Netlify config)

#### G. Password Policy (Optional)

- Increase min length to 8+ chars
- Add complexity rules (uppercase, number, symbol) via Supabase Auth settings

---

## 6. Payment & Subscription Integration Plan

### 6.1 Business Model

- **Price:** $1/month subscription
- **Product:** Full access to Legacy Life Builder (goals, habits, planner, today, statistics)
- **Phase 1:** Dummy/test integration (Stripe Test Mode)

### 6.2 Recommended Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| **Payment provider** | Stripe | Industry standard, test mode, webhooks |
| **Backend** | Supabase Edge Functions | Serverless, same project |
| **Webhook handler** | Supabase Edge Function | `stripe.webhooks.constructEvent` |

### 6.3 Integration Steps (Dummy/Test)

1. **Stripe account**
   - Create Stripe account
   - Get test API keys (pk_test_*, sk_test_*)
   - Create Product: "Legacy Life Builder Monthly" — $1/month
   - Create Price: recurring monthly

2. **Supabase**
   - Add `subscriptions` table (see 5.3.B)
   - Create Edge Function: `create-checkout-session` (creates Stripe Checkout, returns URL)
   - Create Edge Function: `stripe-webhook` (handles `checkout.session.completed`, `customer.subscription.*`, updates `subscriptions`)

3. **Frontend**
   - Add `/subscribe` or `/pricing` page
   - "Subscribe for $1/month" button → calls Edge Function → redirects to Stripe Checkout
   - After success, Stripe redirects to `/?success=true`
   - Add `SubscriptionGate` or extend `ProtectedRoute` to check `subscriptions.status = 'active'`

4. **Webhook**
   - Stripe Dashboard → Webhooks → Add endpoint: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret to Supabase secrets

### 6.4 Data Flow (Dummy)

```
User clicks "Subscribe"
  → Frontend calls Edge Function (JWT)
  → Edge Function creates Stripe Checkout Session
  → User redirected to Stripe Checkout
  → User pays (test card 4242 4242 4242 4242)
  → Stripe sends webhook to Edge Function
  → Edge Function updates subscriptions table
  → User redirected to app
  → ProtectedRoute checks subscription → access granted
```

---

## 7. Environment & Deployment

### 7.1 Environment Variables (`.env`)

Copy `.env.example` to `.env` and fill in values. All sensitive/config values live in `.env`.

```env
# Required
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Optional - AI goal plan generation
VITE_GEMINI_API_KEY=<api_key>
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_AI_MODEL=arcee-ai/trinity-large-preview:free
```

### 7.2 Supabase Setup

1. Create project at supabase.com
2. Run `database-schema.sql` in SQL Editor
3. Create `avatars` storage bucket (public or with RLS)
4. Enable Email auth (and Google OAuth if desired)
5. Configure redirect URLs in Auth settings

### 7.3 Build & Deploy

```bash
npm install
npm run build   # Output: dist/
```

- **Vercel:** Connect repo, set env vars, deploy
- **Netlify:** Same
- Ensure redirect rules for SPA: all routes → `index.html`

---

## Appendix A: File Reference

| Category | Paths |
|----------|-------|
| Entry | `index.html`, `src/main.tsx`, `src/App.tsx` |
| Auth | `src/contexts/auth-context.tsx`, `src/lib/supabaseClient.ts`, `src/components/protected-route.tsx`, `src/features/auth/*` |
| API | `src/api/services/*.ts`, `src/api/helpers/auth-helpers.ts` |
| DB schema | `database-schema.sql` |
| Types | `src/types/domain.ts`, `src/types/planner.ts` |

---

## Appendix B: Security Checklist Before Payment Launch

- [ ] Move `VITE_GEMINI_API_KEY` to Supabase Edge Function
- [ ] Add `subscriptions` table and RLS
- [ ] Implement Stripe Checkout + webhook
- [ ] Add `SubscriptionGate` / subscription check in routes
- [ ] Verify webhook signature in Edge Function
- [ ] Test with Stripe test cards
- [ ] Enable Supabase rate limiting
- [ ] Review CORS and security headers
- [ ] Consider stronger password policy

---

*End of documentation*
