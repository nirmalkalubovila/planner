# React Planner App

A comprehensive, production-ready week planner application built with React, Vite, Tailwind CSS (v4), and Supabase.

## Features
- **Authentication**: Email/Password and Google OAuth support.
- **Weekly Planner**: Create and track your goals dynamically using a 48-slot week planner.
- **Task Tracking**: Daily schedule populated based on your active goals and recurring habits.
- **Habits**: Schedule recurring tasks.
- **Data Persistence**: Uses a Supabase PostgreSQL backend directly linked to authenticated users via Row Level Security (RLS).
- **Modern UI**: Styled efficiently using `shadcn/ui` and tailwind-animate components.

## Getting Started

### Prerequisites
- Node.js (version 20+ recommended)
- A Supabase account

### Installation

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Establish your Environment Variables:
   Create a `.env` file in the root directory and provide your Supabase connection strings:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Setup your Database:
   Copy the contents of `database-schema.sql` completely, navigate to your newly created Supabase Project online, open the **SQL Editor**, paste the SQL instructions, and run it. This provisions your tables, foreign keys, constraints, and Row Level Security rules securely out of the box.

### Running Locally
To run the local development server:
```bash
npm run dev
```

### Production Build
To create a production-optimized build:
```bash
npm run build
```
This generates static files inside the `/dist` directory.

## Project Structure
- `src/api` - React Query services communicating directly with Supabase.
- `src/components` - Reusable interface components and form controls.
- `src/contexts` - Universal React contexts (like the AuthProvider).
- `src/layout` - Structural grid templates used out through the dashboard.
- `src/pages` - Standalone page components dynamically routed via `react-router-dom`.
- `src/types` - Global TypeScript interfaces for Database matching context.
- `src/utils` - Isolated utility and helper scripts (e.g. week calculators).
