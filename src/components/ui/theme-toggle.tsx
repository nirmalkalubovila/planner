import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-9 w-9 rounded-full relative', className)}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className="h-4 w-4 scale-100 opacity-100 transition-all dark:scale-0 dark:opacity-0" />
      <Moon className="absolute h-4 w-4 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
