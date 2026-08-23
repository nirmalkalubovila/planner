/**
 * Shared Tailwind theme extension — the color/radius tokens both apps'
 * tailwind.config.js spread into their own `theme.extend`. Values are CSS
 * custom-property references (`hsl(var(--x))`); the properties themselves
 * are defined in ./tokens.css (:root/.dark/.light), imported separately by
 * each app.
 *
 * @type {import('tailwindcss').Config['theme']}
 */
export const themeExtend = {
  colors: {
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      foreground: "hsl(var(--secondary-foreground))",
    },
    destructive: {
      DEFAULT: "hsl(var(--destructive))",
      foreground: "hsl(var(--destructive-foreground))",
    },
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))",
    },
    popover: {
      DEFAULT: "hsl(var(--popover))",
      foreground: "hsl(var(--popover-foreground))",
    },
    card: {
      DEFAULT: "hsl(var(--card))",
      foreground: "hsl(var(--card-foreground))",
    },
    /* Intent tokens (goals/habits/warning) — replace hardcoded emerald/blue/amber */
    intent: {
      goal: {
        DEFAULT: "hsl(var(--intent-goal))",
        foreground: "hsl(var(--intent-goal-foreground))",
        muted: "hsl(var(--intent-goal-muted) / 0.1)",
      },
      habit: {
        DEFAULT: "hsl(var(--intent-habit))",
        foreground: "hsl(var(--intent-habit-foreground))",
        muted: "hsl(var(--intent-habit-muted) / 0.1)",
      },
      warning: {
        DEFAULT: "hsl(var(--intent-warning))",
        foreground: "hsl(var(--intent-warning-foreground))",
        muted: "hsl(var(--intent-warning-muted) / 0.1)",
      },
    },
    /* Effect tokens for glass/surface */
    glass: "hsl(var(--glass) / 0.03)",
    "glass-border": "hsl(var(--glass) / 0.1)",
    "surface-elevated": "hsl(var(--surface-elevated))",
  },
  borderRadius: {
    lg: "var(--radius)",
    md: "calc(var(--radius) - 2px)",
    sm: "calc(var(--radius) - 4px)",
  },
};

export default { theme: { extend: themeExtend } };
