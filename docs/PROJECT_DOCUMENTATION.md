# Legacy Life Builder -- Full A-Z Project Documentation

> **Version:** 2.0
> **Last Updated:** August 2026
> **Purpose:** Complete technical reference for developers, security audit, and future payment gateway integration.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Authentication](#3-authentication)
4. [Database](#4-database)
5. [Features](#5-features)
6. [Notification System](#6-notification-system)
7. [Admin Panel](#7-admin-panel)
8. [Public Pages & Landing](#8-public-pages--landing)
9. [PWA & Service Worker](#9-pwa--service-worker)
10. [Security](#10-security)
11. [Performance & Optimization](#11-performance--optimization)
12. [Environment & Deployment](#12-environment--deployment)
13. [Supabase Edge Functions](#13-supabase-edge-functions)
14. [Payment & Subscription Integration Plan](#14-payment--subscription-integration-plan)

---

## 1. Project Overview

### 1.1 What It Is

**Legacy Life Builder** is a production-deployed Progressive Web App (PWA) that serves as an AI-powered personal operating system. It helps users:

- Plan and track **goals** with AI-generated or manual action plans and milestones
- Build and maintain **habits** with recurring schedules and day-of-week selection
- Manage a **48-slot weekly planner** (7 days x 48 half-hour slots) with drag-and-drop
- View a **Today** dashboard with gamified daily themes and task completion tracking
- Capture ideas instantly via **The Vault** (notes, quotes, reminders across 7 categories)
- Track **statistics** with a performance dashboard, weekly insights stories, and social sharing
- Manage **profile** (avatar, preferences, sleep schedule, cognitive preferences, security)
- Submit **feedback** and rate the app (Bug Reports, Feature Requests, Reviews)
- **Install as a native app** on any device via PWA
- Receive **push notifications** (task reminders, daily briefing, goal deadlines, streaks, and more)
- View a beautiful **landing page** with testimonials, product gallery, and creator profile
- **Admin panel** for managing users, feedbacks, landing config, email templates, and app updates

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, TypeScript |
| **Styling** | Tailwind CSS v4, Radix UI, Framer Motion |
| **State** | TanStack React Query, Zustand |
| **Auth & DB** | Supabase (Auth + PostgreSQL + Storage + Edge Functions) |
| **Routing** | React Router v7 |
| **Forms** | React Hook Form, Zod |
| **Notifications** | Web Push API, Service Worker, Zustand notification store |
| **PWA** | Service Worker (custom sw.js), Web App Manifest |
| **Icons** | Lucide React |
| **Fonts** | Outfit, Inter (Google Fonts) |
| **Date Handling** | date-fns |
| **Image Crop** | react-easy-crop |
| **Toast** | Sonner (responsive toaster) |
| **Deployment** | Vercel |
| **Domain** | legacylifebuilder.xyz |

### 1.3 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | Core UI library |
| `@supabase/supabase-js` | ^2.97.0 | Backend client |
| `@tanstack/react-query` | ^5.90.21 | Server state caching |
| `zustand` | ^5.0.11 | Client state (notifications) |
| `framer-motion` | ^12.34.3 | Animations & transitions |
| `lucide-react` | ^0.575.0 | Icon system |
| `react-router-dom` | ^7.13.0 | Routing |
| `sonner` | ^2.0.7 | Toast notifications |
| `zod` | ^4.3.6 | Schema validation |
| `drag-drop-touch` | ^1.3.1 | Touch drag-and-drop support |
| `react-easy-crop` | ^5.5.6 | Avatar image cropping |
| `date-fns` | ^3.6.0 | Date utilities |
| `next-themes` | ^0.4.6 | Theme management (light/dark) |

### 1.4 Directory Structure

```
planner/
├── src/
│   ├── api/
│   │   ├── helpers/          # auth-helpers.ts (getCurrentUserId, getOptionalUserId)
│   │   └── services/         # All Supabase service modules (12 files)
│   │       ├── admin-smtp-service.ts
│   │       ├── custom-task-service.ts
│   │       ├── feedback-service.ts
│   │       ├── goal-service.ts
│   │       ├── habit-service.ts
│   │       ├── missed-task-service.ts
│   │       ├── planner-service.ts
│   │       ├── profile-service.ts
│   │       ├── reminder-service.ts
│   │       ├── today-service.ts
│   │       ├── update-service.ts
│   │       └── vault-service.ts
│   ├── assets/               # Static assets
│   ├── components/
│   │   ├── common/           # Shared components (12 files)
│   │   │   ├── ai-loading-popup.tsx
│   │   │   ├── announcement-banner.tsx
│   │   │   ├── confirmation-dialog.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── install-pwa-prompt.tsx
│   │   │   ├── maintenance-page.tsx
│   │   │   ├── notification-bell.tsx
│   │   │   ├── notification-panel.tsx
│   │   │   ├── notification-permission-banner.tsx
│   │   │   ├── notification-provider.tsx
│   │   │   ├── page-loader.tsx
│   │   │   └── standard-dialog.tsx
│   │   ├── protected-route.tsx
│   │   └── ui/               # Design system primitives (16 files)
│   │       ├── ai-loading.tsx, auth-layout.tsx, button.tsx
│   │       ├── calendar.tsx, card.tsx, circular-progress.tsx
│   │       ├── date-picker.tsx, feedback-loader.tsx
│   │       ├── form-components.tsx, input.tsx, popover.tsx
│   │       ├── responsive-toaster.tsx, select.tsx
│   │       ├── simple-time-picker.tsx, theme-toggle.tsx
│   │       └── typography.tsx
│   ├── constants/            # scheduling.ts
│   ├── contexts/             # auth-context.tsx (AuthProvider)
│   ├── features/
│   │   ├── (public)/         # Landing page, Privacy, Terms, Refund pages
│   │   ├── admin/            # Admin panel (guard, constants, page)
│   │   ├── auth/             # Login, Signup, Forgot/Reset Password, OTP, Personalize
│   │   ├── goals/            # Goals management + AI/Manual plan generation
│   │   ├── habits/           # Habits management with day-of-week scheduling
│   │   ├── planner/          # Weekly planner grid + toolbar
│   │   ├── profile/          # Profile info, preferences, security, notifications, feedback, install, updater
│   │   ├── simulator/        # Deployment & Update Lifecycle Simulator (educational)
│   │   ├── statistics/       # Performance dashboard, insights stories, calculations, sharing
│   │   ├── today/            # Today view with 8 gamified daily themes
│   │   └── vault/            # Notes (7 categories), reminders, quick capture
│   ├── hooks/                # 9 custom hooks (notifications, timers, etc.)
│   ├── layout/               # Header, Sidebar, Dashboard Layout, Mobile Nav
│   ├── lib/                  # Supabase client, notification service/store, theme registry, utils
│   ├── types/                # domain.ts, planner.ts, vault.ts, notification-types.ts, global-types.ts
│   └── utils/                # 12 utility modules (analytics, insights, time, week, share, etc.)
├── database-schema.sql       # Full DB schema + RLS policies
├── docs/                     # Documentation
├── public/                   # Static assets, SW, manifest, robots, sitemap, logos
├── supabase/
│   └── functions/            # Edge Functions (AI plan generation, push notifications)
├── vercel.json               # Deployment config with security headers
├── index.html                # PWA-ready HTML with SEO meta, OpenGraph, JSON-LD
└── package.json
```

---

## 2. Architecture

### 2.1 Entry Flow

```
index.html → main.tsx (ThemeProvider via next-themes)
  → App.tsx
    → ErrorBoundary (global error catch + chunk error recovery)
    → RouterProvider
      → RootLayout
        → QueryClientProvider (TanStack React Query)
        → AuthProvider (Supabase Auth)
        → ResponsiveToaster (Sonner, theme-aware)
        → MaintenanceGuard (checks landing_page_settings.maintenance_mode)
        → Outlet (renders matched route)
```

### 2.2 Data Flow

- **Auth:** Supabase Auth -> `AuthContext` -> `useAuth()` -> `ProtectedRoute` / pages
- **Data:** Supabase client -> API services in `src/api/services/` -> TanStack Query hooks (5 min cache, 10 min GC)
- **RLS:** Every Supabase query is filtered by `auth.uid() = user_id` at the database level
- **Notifications:** Zustand store (`notification-store.ts`) -> persisted in `user_profiles.notifications` (jsonb) + browser push via `notification-service.ts`
- **Maintenance Mode:** Cached in `sessionStorage` with background refresh to avoid blocking renders

### 2.3 Lazy Loading

All page components are lazy-loaded using a custom `lazyRetry` utility that:
- Wraps `React.lazy()` with automatic retry on chunk-loading failures
- Uses `sessionStorage` flag to prevent infinite reload loops
- Wrapped in `<Suspense>` with `<PageLoader />` fallback

### 2.4 Route Structure

| Path | Protection | Description |
|------|------------|-------------|
| `/` | Conditional | Landing page (new visitors) / Redirect to `/today` (logged-in) / Redirect to `/login` (returning visitors) |
| `/privacy` | Public | Privacy Policy page |
| `/terms` | Public | Terms of Service page |
| `/refund` | Public | Refund Policy page |
| `/login` | AuthRoute (redirect if logged in) | Login page (email/password + Google OAuth) |
| `/signup` | AuthRoute | Signup page |
| `/forgot-password` | AuthRoute | Password reset request |
| `/reset-password` | Public | Password reset (token in URL) |
| `/personalize` | Redirect | Redirects to `/today` |
| `/today` | ProtectedRoute + DashboardLayout | Today's schedule with gamified themes |
| `/habits` | ProtectedRoute + DashboardLayout | Habits management |
| `/goals` | ProtectedRoute + DashboardLayout | Goals management with AI plans |
| `/planner` | ProtectedRoute + DashboardLayout | Weekly planner grid |
| `/vault` | ProtectedRoute + DashboardLayout | The Vault (notes & reminders) |
| `/profile` | ProtectedRoute + DashboardLayout | Profile, preferences, notifications, feedback |
| `/statistics` | ProtectedRoute + DashboardLayout | Performance dashboard |
| `/statistics/calculations` | ProtectedRoute + DashboardLayout | Stats calculations detail page |
| `/simulator` | ProtectedRoute + DashboardLayout | Deployment lifecycle simulator (educational) |
| `/admin` | ProtectedRoute (admin email check) | Admin panel (standalone layout) |

### 2.5 Sidebar Navigation

| Name | Path | Icon | Label |
|------|------|------|-------|
| Home | `/today` | Home | Execution |
| Habits | `/habits` | ListTodo | Consistency |
| Goals | `/goals` | Target | Vision |
| Planner | `/planner` | CalendarDays | Strategy |
| The Vault | `/vault` | Vault | Notes |
| Statistics | `/statistics` | BarChart2 | Insights |
| Admin Panel | `/admin` | Shield | Management (admin only) |

---

## 3. Authentication

### 3.1 Provider: Supabase Auth

- **Client:** `src/lib/supabaseClient.ts` -- `createClient(supabaseUrl, supabaseAnonKey)`
- **Context:** `src/contexts/auth-context.tsx` -- `AuthProvider` exposes `user`, `session`, `isLoading`, `signOut`

### 3.2 Auth Flows

#### Login (`src/features/auth/forms/login-form.tsx`)

1. **Email/Password:** `supabase.auth.signInWithPassword({ email, password })`
2. **Google OAuth:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
3. **Email not confirmed:** User can resend OTP -> `onRequireOtp(email)` -> OTP verification screen

#### Signup (`src/features/auth/forms/signup-form.tsx`)

1. **Validation:** Password >= 6 chars, passwords match
2. **Email/Password:** `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
3. **Result:**
   - If `data.session` exists -> auto-confirmed -> redirect to app
   - Else -> email confirmation required -> `onRequireOtp(email)`

#### OTP Verification (`src/features/auth/components/otp-verification.tsx`)

- 8-digit OTP via `verifyOtp` / `resend` for signup confirmation

#### Forgot Password (`src/features/auth/forms/forgot-password-form.tsx`)

- `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`

#### Reset Password (`src/features/auth/forms/reset-password-form.tsx`)

- Listens for `PASSWORD_RECOVERY` event -> `supabase.auth.updateUser({ password })`

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
- **AdminGuard** (`src/features/admin/admin-guard.tsx`): Only allows admin emails through; non-admins redirect to `/today`

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
| **user_profiles** | User preferences, cognitive profile, sleep, planning schedule | `user_id` (UNIQUE), `full_name`, `dob`, `sleep_start`, `sleep_duration`, `week_start`, `plan_day`, `plan_start_time`, `plan_end_time`, `primary_life_focus`, `current_profession`, `energy_peak_time`, `focus_ability`, `task_shifting_ability`, `is_personalized`, `avatar_url`, `notification_prefs` (jsonb), `notifications` (jsonb) |
| **goals** | User goals with AI/manual plans and milestones | `user_id`, `name`, `purpose`, `startDate`, `endDate`, `goalType` (Week/Month/Year), `durationValue`, `plans` (jsonb - AIGeneratedPlanSlot[]), `milestones` (jsonb - Milestone[]), `code` |
| **habits** | Recurring habits with time + day scheduling | `user_id`, `name`, `description`, `startTime`, `endTime`, `purpose`, `startDate`, `endDate`, `daysOfWeek` (jsonb) |
| **week_plans** | Weekly planner grid state | `user_id`, `week`, `state` (jsonb - GridState), UNIQUE(user_id, week) |
| **custom_tasks** | Task library (reusable task templates) | `user_id`, `name`, `description`, `startTime`, `endTime`, `daysOfWeek` (jsonb) |
| **completed_tasks** | Daily task completion tracking | `user_id`, `dayStr`, `taskIds` (jsonb), UNIQUE(user_id, dayStr) |
| **missed_tasks** | Tasks that were missed/incomplete | `user_id`, `name`, `description`, `startTime`, `endTime`, `daysOfWeek` (jsonb) |
| **vault_notes** | Lightning-fast notes across 7 categories | `user_id`, `title`, `content`, `category` (ideas/problems/future/nextweek/quotes/reading/resources), `source_page`, `tags` (jsonb), `is_pinned` |
| **vault_reminders** | Smart repeatable notification reminders attached to notes | `user_id`, `note_id` (FK -> vault_notes), `title`, `body`, `repeat_type` (daily/every_2_days/weekly/random/once), `remind_at` (HH:mm), `next_fire` (timestamptz), `is_active`, `snooze_count` |
| **push_subscriptions** | Web Push API subscription storage | `user_id`, `endpoint`, `p256dh`, `auth`, `user_agent`, UNIQUE(user_id, endpoint) |
| **notification_sent_log** | Server-side deduplication of sent notifications | `user_id`, `notification_tag`, `sent_at`, UNIQUE(user_id, notification_tag) |
| **feedbacks** | User feedback and issue reports | `user_id`, `category` (Bug Report/Feature Request/About Legacy Life Builder/Other), `subject`, `message`, `status` (open/reviewed/resolved) |
| **app_updates** | Version release notes managed by admin | `version`, `title`, `description`, `release_date` |
| **landing_page_settings** | Landing page configuration (videos, gallery, maintenance mode) | `id=1`, `maintenance_mode`, `desktop_video_url`, `mobile_video_url`, `desktop_gallery`, `mobile_gallery` |

### 4.3 RLS Policies

**Standard user tables** (user_profiles, goals, habits, week_plans, custom_tasks, completed_tasks, missed_tasks, vault_notes, vault_reminders, push_subscriptions):

```sql
CREATE POLICY "Users can manage their own <table>" ON <table>
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Feedbacks (mixed access):**
```sql
-- Users can insert and read their own
CREATE POLICY "Users can insert own feedback" ON feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON feedbacks FOR SELECT USING (auth.uid() = user_id);
-- Admin can read all and update status
CREATE POLICY "Admin can read all feedbacks" ON feedbacks FOR SELECT USING (auth.jwt() ->> 'email' = '<admin_email>');
CREATE POLICY "Admin can update feedbacks" ON feedbacks FOR UPDATE USING (auth.jwt() ->> 'email' = '<admin_email>');
-- Admin can also read all user_profiles
CREATE POLICY "Admin can read all profiles" ON user_profiles FOR SELECT USING (auth.jwt() ->> 'email' = '<admin_email>');
```

**Notification sent log (no direct user access):**
```sql
CREATE POLICY "No direct user access" ON notification_sent_log FOR ALL USING (false);
```

**Cleanup function:**
```sql
CREATE OR REPLACE FUNCTION clean_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_sent_log WHERE sent_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.4 Storage

- **Bucket:** `avatars`
- **Path:** `{user_id}/avatar.jpg`
- **Usage:** Profile avatar upload (profile-info.tsx) with react-easy-crop
- **Validation:** 5 MB max, `image/jpeg`, `image/png`, `image/webp`
- **Note:** Bucket and RLS policies must be configured in Supabase Dashboard

---

## 5. Features

### 5.1 Today View (`/today`)

**Purpose:** Daily execution dashboard showing today's scheduled tasks.

**Components:**
- `today-page.tsx` -- Main page with task list and completion tracking
- `active-theme.tsx` -- Gamified theme wrapper that rotates daily
- 8 daily themes in `daily-themes/`:
  - **Combo Chain** -- Streak-based task completion visualization
  - **Discipline Battery** -- Battery-charging metaphor for progress
  - **Forge System** -- Blacksmith/crafting theme for task completion
  - **Territory Expansion** -- Map-based territory conquest theme
  - **Life Support System (Heartbeat)** -- Medical heartbeat monitor theme
  - **Level Up Identity (XP Burst)** -- RPG experience points theme
  - **Engine Dashboard** -- Race car engine/RPM theme
  - **Daily Boss Fight** -- Boss battle HP-bar theme

**Data Flow:**
1. Fetches current week's planner state + habits + completed tasks
2. `useTodayTasks` hook computes today's task list with time slots
3. Each task can be toggled complete/incomplete
4. Points system tracks progress for the daily theme visualization

### 5.2 Habits (`/habits`)

**Purpose:** Create and manage recurring habits with flexible scheduling.

**Key Features:**
- Create habits with name, description, purpose, time range (HH:mm), and day-of-week selection
- Edit and delete habits
- Habits auto-populate in the weekly planner grid
- Start/end date support for time-limited habits

**Components:** `habits-page.tsx`, `habit-card.tsx`, forms

### 5.3 Goals (`/goals`)

**Purpose:** Set long-term goals and generate actionable plans.

**Key Features:**
- Create goals with name, purpose, start/end date, goal type (Week/Month/Year)
- **AI Plan Generation** (`ai-generation-step.tsx`): Uses Supabase Edge Function to generate detailed day-by-day action plans via AI
- **Manual Plan Creation** (`manual-plan-step.tsx`): Create plans manually
- **Strategy Choice Dialog**: Choose between AI-generated and manual planning
- **Milestone tracking**: Create milestones with target dates and completion status
- **Progress bar**: Visual goal progress calculated by `analytics-engine.ts`
- **Master Action Plan** (`master-action-plan.tsx`): Comprehensive view of all plan details

**Goal Types:** Week, Month, Year

**AI Plan Structure (AIGeneratedPlanSlot):**
```ts
interface AIGeneratedPlanSlot {
    date: string;
    dayTask: string;
    description: string;
    subPlans?: AIGeneratedPlanSlot[];
    estimatedHours?: number;
}
```

### 5.4 Planner (`/planner`)

**Purpose:** 48-slot weekly planner grid for time-boxing and scheduling.

**Key Features:**
- 7-day x 48-slot grid (each slot = 30 minutes)
- Drag and drop tasks (with touch support via `drag-drop-touch`)
- Assign goals, habits, and custom tasks to specific time slots
- Color-coded by task type (goal/habit/custom)
- Reminder items within the planner
- Week navigation (forward/back)
- Planner toolbar for bulk operations

**Grid State Type:**
```ts
type GridState = Record<string, PlanSlot> & { reminders?: ReminderItem[] };

interface PlanSlot {
    type: 'goal' | 'custom' | 'habit';
    name: string;
    goalId?: string;
    color?: string;
    isReminder?: boolean;
    description?: string;
}
```

### 5.5 The Vault (`/vault`)

**Purpose:** Lightning-fast note capture and organization system.

**Components:**
- `vault-page.tsx` -- Main page with filters, notes grid, capture bar
- `capture-bar.tsx` -- Quick-capture input for instant note creation
- `note-card.tsx` -- Individual note display card
- `note-view-dialog.tsx` -- Full note view/edit dialog
- `quote-card.tsx` -- Specialized display for quote-type notes
- `vault-filters.tsx` -- Category and type filter controls
- `note-form.tsx` -- Note creation/editing form
- `reminder-form.tsx` -- Reminder creation form

**7 Categories:**
| Category | Label | Color |
|----------|-------|-------|
| `ideas` | Ideas | Cyan |
| `problems` | Problems | Rose |
| `future` | Future | Violet |
| `nextweek` | Next Week | Amber |
| `quotes` | Quotes | Emerald |
| `reading` | Reading | Teal |
| `resources` | Resources | Indigo |

**Smart Reminders:**
- Attached to notes via `vault_reminders` table
- Repeat types: `daily`, `every_2_days`, `weekly`, `random`, `once`
- `random` type fires 2-4 days later at a random time (9AM-9PM) to prevent notification fatigue
- Auto-calculated `next_fire` timestamps
- Snooze support with counter

**Additional Features:**
- Auto-tag extraction from content (`#tag-name` parsing)
- Pin/unpin notes
- Source page tracking (captures which page the note was created from)
- Filter by category or reminders

### 5.6 Statistics & Life Buckets (`/statistics`)

**Purpose:** Performance analytics, KONIK 4 Life Buckets balance tracking, and weekly insights.

**4 Life Buckets Framework (`src/types/time.ts`):**
- **Income-Producing:** Job, paid work, client projects
- **Asset-Building:** Skills, content, learning, side projects
- **Recovery:** Sleep, rest, exercise, health
- **Relational:** Family, friends, real human connection

**Components:**
- `statistics-page.tsx` -> `performance-dashboard.tsx` -- Main dashboard entry
- `summary-view.tsx` -- Summary statistics overview + **Life Balance Card** (4-bucket weekly distribution)
- `detailed-view.tsx` -- Deep analysis across Habits, Goals, Weekly Execution, and **Life Buckets Deep Analysis**
- `bucket-selector.tsx` -- Reusable 4-pill selector component for tagging goals, habits, and custom tasks
- `calculations-page.tsx` -- Stats calculations detail page

**Insights System** (`insights/`):
- `insights-view.tsx` -- Instagram Stories-style swipeable weekly wrapped
- `insight-card.tsx` -- Individual insight card with support for `bucketBalance` and `executionBalance` story types
- `insight-themes.ts` -- Visual theme definitions for insight cards
- `story-viewer.tsx` -- Full-screen story viewer with progress bars
- `share-button.tsx` -- Social sharing trigger
- `share-card-renderer.tsx` -- Canvas-based card rendering for sharing

**Analytics & Bucket Engines:**
- `analytics-engine.ts`: Goal progress, milestone velocity, habit consistency, trajectory scoring
- `bucket-engine.ts`: Maps planner grid slots to source item buckets, calculates weekly hours/percentages per bucket, detects 2+ week empty bucket streaks, and scores 1-10 bucket health balance
- `insights-engine.ts`: Generates weekly wrapped cards including `bucketBalance` distribution and `executionBalance` scores

**Social Sharing** (`share-utils.ts`):
- Native Web Share API (mobile: WhatsApp, Instagram Stories, etc.)
- Direct image download
- Clipboard copy
- Canvas-to-blob rendering for shareable insight cards

### 5.7 Profile (`/profile`)

**Purpose:** User account management and app configuration.

**Sections:**
1. **Profile Info** (`profile-info.tsx`): Avatar upload with cropping, full name, email display
2. **Profile Preferences** (`profile-preferences.tsx`): Sleep schedule, week start day, planning session config, cognitive preferences (energy peak, focus ability, task shifting)
3. **Profile Security** (`profile-security.tsx`): Password change, account management
4. **Notification Preferences** (`notification-preferences.tsx`): Granular push notification controls for 14+ notification types, quiet hours, weekly/monthly report scheduling
5. **Feedback Section** (`feedback-section.tsx`): Submit bug reports, feature requests, reviews with star ratings and testimonial consent
6. **Install App** (`install-app-section.tsx`): PWA installation guidance for desktop, Android, and iOS
7. **App Updater Simulator** (`app-updater-simulator.tsx`): Version update simulator component

### 5.8 Simulator (`/simulator`)

**Purpose:** Educational tool that demonstrates how PWA deployment and update lifecycles work.

**Features:**
- Interactive simulation comparing Standard SPA vs PWA update behavior
- Server Panel: Deploy versions, toggle chunk pruning, go offline
- Network Bus: Visualize request/response flow
- Browser Mockup: Simulated app with lazy-loaded pages
- Cache Viewer: Inspect service worker cache contents
- Console Log: Real-time event logging

**Components:** `server-panel.tsx`, `network-bus.tsx`, `browser-mockup.tsx`, `cache-viewer.tsx`, `console-log.tsx`

**State Management:** Zustand store (`simulator-store.ts`) + custom timers hook (`use-simulation-timers.ts`)

---

## 6. Notification System

### 6.1 Overview

The notification system is a comprehensive, multi-layered system with both in-app and push notification support.

### 6.2 Notification Types (14 types)

| Type | Description |
|------|-------------|
| `task_starting` | Task is about to start (15 min before) |
| `task_overdue` | Task time has passed without completion |
| `stats_changed` | Statistics have changed significantly |
| `streak_milestone` | Streak milestone reached |
| `daily_briefing` | Morning daily briefing |
| `day_summary` | End-of-day summary |
| `goal_deadline` | Goal deadline approaching |
| `goal_completed` | Goal has been completed |
| `weekly_summary` | Weekly performance summary |
| `burnout_warning` | Burnout risk detected |
| `achievement` | Achievement unlocked |
| `sleep_start` | Bedtime reminder |
| `sleep_end` | Wake-up reminder |
| `weekly_planning` | Weekly planning session reminder |

### 6.3 Notification Hooks (9 hooks in `src/hooks/`)

| Hook | Purpose |
|------|---------|
| `use-daily-briefing.ts` | Generates morning briefing notifications |
| `use-day-summary.ts` | Generates end-of-day summary |
| `use-goal-notifications.ts` | Monitors goal deadlines and completion |
| `use-sleep-and-planning-notifications.ts` | Sleep and planning time reminders |
| `use-stats-notifications.ts` | Detects significant stats changes |
| `use-task-notifications.ts` | Task start/overdue reminders (15 min window) |
| `use-vault-reminders.ts` | Fires vault note reminders |
| `use-time-lived.ts` | Calculates time lived from DOB for header display |
| `use-latest-update.ts` | Fetches latest app update for announcement banner |

### 6.4 Notification Infrastructure

- **Store** (`lib/notification-store.ts`): Zustand store with in-app notification queue, persisted to `user_profiles.notifications` jsonb
- **Service** (`lib/notification-service.ts`): Web Push API integration -- subscribe/unsubscribe, permission management
- **Provider** (`components/common/notification-provider.tsx`): Wraps app with all notification hooks
- **Bell** (`components/common/notification-bell.tsx`): Header notification indicator
- **Panel** (`components/common/notification-panel.tsx`): Dropdown notification list
- **Permission Banner** (`components/common/notification-permission-banner.tsx`): Prompts for push permission
- **Rate Limiting:** Max 3 notifications per hour (`MAX_NOTIFICATIONS_PER_HOUR`)
- **Quiet Hours:** Configurable quiet period (derived from sleep schedule)
- **Deduplication:** Server-side via `notification_sent_log` table + `dedupKey` on client

### 6.5 Push Notification Flow

```
User grants permission → subscribeToPush() → stores subscription in push_subscriptions table
→ Supabase Edge Function (send-push-notifications) fires on schedule
→ Reads user preferences, calculates due notifications
→ Sends Web Push via VAPID keys
→ Service Worker receives push event → shows native notification
→ Notification click → opens app to relevant route (actionUrl)
```

---

## 7. Admin Panel (`/admin`)

### 7.1 Access Control

- **Allowed Emails:** `legacylifebuilder.konik@email.com` (defined in `admin-constants.ts`)
- **Client-side:** `isAdminEmail()` check + `AdminGuard` component
- **Server-side:** RLS policies on feedbacks and user_profiles with admin email JWT check

### 7.2 Admin Tabs

| Tab | Description |
|-----|-------------|
| **Dashboard** | Overview stats: Total Users, Active Users (7d), Engagement Rate, Most Used Feature, New This Week, Open Issues. Includes "Road to 50 Active Users" growth tracker with progress bar and estimated weeks to target. |
| **Feedbacks** | View, filter, search all user feedback. Update status (open/reviewed/resolved). Edit feedback details. |
| **Users** | User activity overview with engagement tier classification (Power User / Active / Casual / Dormant / Ghost). Shows user profiles, last activity, and feature usage. |
| **Mails** | Global SMTP settings configuration. Email template management via secure RPC calls (`get_global_smtp_settings`). |
| **Landing Config** | Landing page settings: hero videos (desktop/mobile URLs), product gallery images, maintenance mode toggle. |
| **App Updates** | Create, view, and delete version release notes. These appear in the announcement banner across the app. |

### 7.3 Engagement Tiers

| Tier | Classification |
|------|---------------|
| Power User | Highest engagement |
| Active | Regular usage |
| Casual | Occasional usage |
| Dormant | Inactive for a period |
| Ghost | Long-term inactive |

---

## 8. Public Pages & Landing

### 8.1 Landing Page (`/`)

**Components** (in `features/(public)/components/`):
| Component | Description |
|-----------|-------------|
| `Navbar.tsx` | Navigation bar with login/signup links |
| `Hero.tsx` | Hero section with video demos (desktop/mobile) |
| `Testimonials.tsx` | Curated user testimonials (from feedbacks with consent) |
| `HowItWorks.tsx` | Step-by-step product explanation |
| `ProductGallery.tsx` | Screenshot gallery (desktop + mobile images) |
| `Features.tsx` | Feature highlights |
| `UniversalAccess.tsx` | Cross-device compatibility showcase |
| `CreatorProfile.tsx` | Creator/founder profile section |
| `Footer.tsx` | Footer with links to privacy, terms, refund |

**Smart Routing Logic:**
- Logged-in user -> redirect to `/today`
- Returning visitor (has `has_logged_in` in localStorage) -> redirect to `/login`
- First-time visitor -> show landing page
- `?bypass=true` query param -> force show landing page

### 8.2 Legal Pages

- **Privacy Policy** (`privacy-page.tsx`)
- **Terms of Service** (`terms-page.tsx`)
- **Refund Policy** (`refund-page.tsx`)

### 8.3 SEO

- Full meta tags (title, description, keywords)
- Open Graph / Facebook meta tags with preview image
- Twitter Card meta tags
- JSON-LD structured data (`SoftwareApplication`)
- Google Search Console verification
- `robots.txt` and `sitemap.xml`
- Canonical URL (`https://www.legacylifebuilder.xyz/`)
- Protected routes have `X-Robots-Tag: noindex, nofollow` via Vercel headers

---

## 9. PWA & Service Worker

### 9.1 Web App Manifest (`public/manifest.json`)

```json
{
  "name": "Legacy Life Builder",
  "short_name": "Legacy LB",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "orientation": "any",
  "categories": ["productivity", "lifestyle", "business"]
}
```

### 9.2 Service Worker (`public/sw.js`)

**Version:** 1.0.4

**Capabilities:**
- **Precaching:** Critical assets (index.html, logo, manifest) + dynamic build chunks via precache-manifest
- **Runtime caching:** Network-first with cache fallback
- **Push notifications:** Handles `push` events with native notification display
- **Notification clicks:** Routes to `actionUrl` from notification payload
- **Cache cleanup:** Deletes old cache versions on activation
- **Offline support:** Serves cached assets when network unavailable

### 9.3 Install Prompt

- **Android/Desktop:** Native `beforeinstallprompt` event captured and surfaced via `install-pwa-prompt.tsx`
- **iOS:** Manual instructions (Share -> Add to Home Screen) displayed in `install-app-section.tsx`
- **Detection:** Checks `display-mode: standalone` to know if already installed

---

## 10. Security

### 10.1 Current Security Measures

| Area | Implementation |
|------|----------------|
| **Auth** | Supabase Auth (JWT, secure session) |
| **DB access** | RLS on all 12+ tables; `auth.uid() = user_id` |
| **Admin RLS** | JWT email check for admin-level policies |
| **API** | No custom backend; Supabase client uses JWT automatically |
| **Client-side** | `getCurrentUserId()` / `getOptionalUserId()` before queries |
| **File upload** | 5 MB limit, type whitelist (jpeg/png/webp) |
| **Password** | Min 6 chars (Supabase default) |
| **Error Recovery** | Global ErrorBoundary with chunk error auto-reload (once) |
| **Maintenance Mode** | Database-driven toggle, admin bypass, session-cached |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` via Vercel |
| **Indexing Protection** | `X-Robots-Tag: noindex, nofollow` on all authenticated routes |
| **Edge Functions** | AI API key secured server-side in Supabase Edge Functions |
| **Notification Dedup** | Server-side dedup log prevents notification spam; 24h auto-cleanup |

### 10.2 Environment Variables

| Variable | Purpose | Required | Exposure |
|----------|---------|----------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | Client (public) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes | Client (public, safe by design) |
| `VITE_GOOGLE_SITE_VERIFICATION` | Google Search Console token | No | Client (meta tag) |

**Never commit `.env`** -- it is in `.gitignore`. Use `.env.example` as a template.

### 10.3 Security Hardening for Payment Integration

#### A. Subscription Table (for $1/month)

```sql
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

#### B. Enforce Subscription on Protected Routes

- Add `subscription_status = 'active'` check in `ProtectedRoute` or a new `SubscriptionGate` component
- Redirect non-subscribers to `/subscribe` or `/pricing`

#### C. Rate Limiting (Supabase)

- Enable Supabase rate limiting in project settings
- Use Supabase Edge Functions for sensitive operations (e.g., payment webhooks)

#### D. Secure Stripe Webhooks

- Verify webhook signature with `stripe.webhooks.constructEvent(payload, sig, secret)`
- Use Supabase Edge Function; never expose webhook logic to client

#### E. CORS & Headers

- Configure Supabase project URL allowlist
- Use `Content-Security-Policy`, `X-Frame-Options` headers (via Vercel config)

#### F. Password Policy (Optional)

- Increase min length to 8+ chars
- Add complexity rules (uppercase, number, symbol) via Supabase Auth settings

---

## 11. Performance & Optimization

### 11.1 Data Caching Strategy

| Setting | Value | Purpose |
|---------|-------|---------|
| `staleTime` | 5 minutes | Prevents refetch on navigation (instant page transitions) |
| `gcTime` | 10 minutes | Keeps data in memory longer for back-navigation |
| `refetchOnWindowFocus` | false | No unnecessary refetches on tab switch |
| `retry` | 1 | Single retry on failure |

### 11.2 Lazy Loading

- All page-level components use `lazyRetry()` for code splitting
- Suspense boundaries with `<PageLoader />` fallback
- Chunk error recovery: auto-reload once on chunk load failure

### 11.3 Maintenance Mode Optimization

- Session-cached (`sessionStorage`) to avoid blocking renders on subsequent navigations
- Background refresh to catch admin changes without blocking UI

### 11.4 Notification Optimization

- Rate limited to 3 per hour client-side
- Quiet hours suppress notifications during sleep
- Server-side deduplication prevents duplicate push sends
- 24-hour auto-cleanup of notification logs

---

## 12. Environment & Deployment

### 12.1 Environment Variables (`.env`)

Copy `.env.example` to `.env` and fill in values:

```env
# Required
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Optional - Google Search Console
VITE_GOOGLE_SITE_VERIFICATION=<token>
```

### 12.2 Supabase Setup

1. Create project at supabase.com
2. Run `database-schema.sql` in SQL Editor
3. Create `avatars` storage bucket (public or with RLS)
4. Enable Email auth (and Google OAuth if desired)
5. Configure redirect URLs in Auth settings
6. Deploy Edge Functions (`generate-ai-plan`, `send-push-notifications`)
7. Set up SMTP for email notifications (optional, admin-configurable)
8. Configure VAPID keys for Web Push

### 12.3 Build & Deploy

```bash
npm install
npm run build   # Output: dist/
```

- **Vercel:** Connect repo, set env vars, deploy (current deployment target)
- `vercel.json` configures:
  - SPA rewrites: all routes -> `/index.html`
  - Security headers on all routes
  - `X-Robots-Tag: noindex` on authenticated routes

### 12.4 Domain

- Production: `https://www.legacylifebuilder.xyz/`

---

## 13. Supabase Edge Functions

### 13.1 `generate-ai-plan`

- **Purpose:** Server-side AI action plan generation for goals
- **Trigger:** Called from goals feature when user chooses AI generation
- **Security:** Requires valid JWT, AI API key stored as Supabase secret (not exposed to client)

### 13.2 `send-push-notifications`

- **Purpose:** Sends Web Push notifications to subscribed users
- **Trigger:** Scheduled (cron) or invoked
- **Flow:** Reads `push_subscriptions` -> checks `notification_sent_log` for dedup -> sends via Web Push API -> logs sent notifications
- **Security:** Uses service role key, VAPID keys stored as secrets

---

## 14. Payment & Subscription Integration Plan

### 14.1 Business Model

- **Price:** $1/month subscription
- **Product:** Full access to Legacy Life Builder
- **Phase 1:** Dummy/test integration (Stripe Test Mode)

### 14.2 Recommended Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| **Payment provider** | Stripe | Industry standard, test mode, webhooks |
| **Backend** | Supabase Edge Functions | Serverless, same project |
| **Webhook handler** | Supabase Edge Function | `stripe.webhooks.constructEvent` |

### 14.3 Integration Steps (Dummy/Test)

1. **Stripe account**
   - Create Stripe account
   - Get test API keys (pk_test_*, sk_test_*)
   - Create Product: "Legacy Life Builder Monthly" -- $1/month
   - Create Price: recurring monthly

2. **Supabase**
   - Add `subscriptions` table (see 10.3.A)
   - Create Edge Function: `create-checkout-session` (creates Stripe Checkout, returns URL)
   - Create Edge Function: `stripe-webhook` (handles `checkout.session.completed`, `customer.subscription.*`, updates `subscriptions`)

3. **Frontend**
   - Add `/subscribe` or `/pricing` page
   - "Subscribe for $1/month" button -> calls Edge Function -> redirects to Stripe Checkout
   - After success, Stripe redirects to `/?success=true`
   - Add `SubscriptionGate` or extend `ProtectedRoute` to check `subscriptions.status = 'active'`

4. **Webhook**
   - Stripe Dashboard -> Webhooks -> Add endpoint: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret to Supabase secrets

### 14.4 Data Flow (Dummy)

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

## Appendix A: File Reference

| Category | Paths |
|----------|-------|
| Entry | `index.html`, `src/main.tsx`, `src/App.tsx` |
| Auth | `src/contexts/auth-context.tsx`, `src/lib/supabaseClient.ts`, `src/components/protected-route.tsx`, `src/features/auth/*` |
| API Services | `src/api/services/*.ts` (12 service files), `src/api/helpers/auth-helpers.ts` |
| DB Schema | `database-schema.sql` |
| Types | `src/types/domain.ts`, `src/types/planner.ts`, `src/types/vault.ts`, `src/types/notification-types.ts`, `src/types/global-types.ts` |
| Layout | `src/layout/header.tsx`, `src/layout/dashboard-sidebar.tsx`, `src/layout/dashboard-layout.tsx`, `src/layout/mobile-nav.tsx` |
| Features | `src/features/{today,habits,goals,planner,vault,statistics,profile,simulator,admin,(public)}/*` |
| Hooks | `src/hooks/*.ts` (9 hooks) |
| Utils | `src/utils/*.ts` (12 utilities) |
| Lib | `src/lib/notification-service.ts`, `src/lib/notification-store.ts`, `src/lib/theme-registry.ts`, `src/lib/utils.ts` |
| UI Components | `src/components/ui/*.tsx` (16 components) |
| Common Components | `src/components/common/*.tsx` (12 components) |
| PWA | `public/sw.js`, `public/manifest.json` |
| SEO | `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt` |
| Edge Functions | `supabase/functions/generate-ai-plan/`, `supabase/functions/send-push-notifications/` |
| Deployment | `vercel.json`, `vite.config.js`, `tailwind.config.js` |

---

## Appendix B: Security Checklist Before Payment Launch

- [ ] Add `subscriptions` table and RLS
- [ ] Implement Stripe Checkout + webhook Edge Functions
- [ ] Add `SubscriptionGate` / subscription check in routes
- [ ] Verify webhook signature in Edge Function
- [ ] Test with Stripe test cards
- [ ] Enable Supabase rate limiting
- [ ] Review CORS and security headers
- [ ] Consider stronger password policy
- [ ] Add Content-Security-Policy header

---

## Appendix C: Common Components Reference

| Component | Purpose |
|-----------|---------|
| `error-boundary.tsx` | Global error catch with chunk error detection, maintenance mode detection, auto-reload recovery |
| `maintenance-page.tsx` | Displayed during maintenance mode or DB connection errors |
| `announcement-banner.tsx` | Shows new version updates and maintenance warnings |
| `notification-bell.tsx` | Header icon with unread badge |
| `notification-panel.tsx` | Dropdown notification list |
| `notification-provider.tsx` | Orchestrates all notification hooks |
| `notification-permission-banner.tsx` | First-time push permission prompt |
| `install-pwa-prompt.tsx` | Native install prompt for PWA |
| `ai-loading-popup.tsx` | Loading overlay during AI operations |
| `confirmation-dialog.tsx` | Reusable confirm/cancel dialog |
| `standard-dialog.tsx` | Reusable standard dialog wrapper |
| `page-loader.tsx` | Loading spinner for Suspense fallbacks |

---

*End of documentation*
