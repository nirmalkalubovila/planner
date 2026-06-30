import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, Copy, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorPageProps {
  error?: Error | null;
  resetError?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error: propError, resetError }) => {
  let routerError: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routerError = useRouteError();
  } catch (e) {
    // Rendered outside react-router context, fallback to propError
  }

  const error = propError || routerError;
  const [copied, setCopied] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  // Extract friendly messages
  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while rendering this page.';
  let statusCode: number | string = '500';
  let errorDetails = '';

  if (error) {
    if (isRouteErrorResponse(error)) {
      statusCode = error.status;
      title = `${error.status} - ${error.statusText}`;
      message = error.data?.message || 'The requested page could not be loaded or was not found.';
      errorDetails = typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2);
    } else if (error instanceof Error) {
      title = error.name || 'Application Error';
      message = error.message || 'A runtime error occurred in the application.';
      errorDetails = error.stack || '';
    } else {
      title = 'Unexpected Error';
      message = typeof error === 'string' ? error : 'An unknown error occurred.';
      errorDetails = JSON.stringify(error, null, 2);
    }
  }

  const handleCopyDetails = async () => {
    const textToCopy = `Error: ${title}\nMessage: ${message}\nDetails:\n${errorDetails}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReload = () => {
    if (resetError) {
      resetError();
    }
    window.location.reload();
  };

  const handleResetApp = () => {
    // Clear all storage to fix potential corrupted data issues
    localStorage.clear();
    sessionStorage.clear();
    // Clear dynamic import retry flag
    sessionStorage.removeItem('page-reloaded-on-error');
    
    // Reload back to home/landing
    window.location.href = '/';
  };

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-foreground flex flex-col justify-between p-6 sm:p-12 md:p-16 relative overflow-x-hidden selection:bg-primary/30">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.12] pointer-events-none" />

      {/* 1. Header (Logo & Brand) */}
      <header className="w-full max-w-7xl mx-auto flex items-center gap-3 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <img src="/white-logo.svg" alt="Legacy Life Builder Logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Legacy Life Builder
          </span>
        </motion.div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="w-full max-w-7xl mx-auto my-auto py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10">
        
        {/* Left Column: Friendly Reassurance & Actions */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          
          {/* Animated Sparkles / Upgrade Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Upgrade & Diagnostics
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-zinc-50"
          >
            We are <span className="bg-gradient-to-r from-primary via-violet-400 to-indigo-400 bg-clip-text text-transparent">leveling up</span> your experience!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl"
          >
            We are currently fine-tuning our system to make it faster, smoother, and more powerful for you. 
            Don't worry—your data and plans are completely safe. Let's perform a quick refresh to get you right back on track.
          </motion.p>

          {/* Action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            <button
              onClick={handleReload}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg transition duration-200 cursor-pointer text-sm group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Reload Page
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-zinc-100 font-semibold rounded-xl transition duration-200 cursor-pointer text-sm"
            >
              <Home className="w-4 h-4 text-zinc-400" />
              Return Home
            </button>
            <button
              onClick={handleResetApp}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 text-destructive font-semibold rounded-xl transition duration-200 cursor-pointer text-sm"
              title="Clears local cache and storage to fix corrupted states."
            >
              <Trash2 className="w-4 h-4" />
              Reset & Fix App
            </button>
          </motion.div>
        </div>

        {/* Right Column: AI Animation & Diagnostics */}
        <div className="lg:col-span-5 w-full flex flex-col items-center justify-center">
          {/* Animated AI GIF Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full max-w-md aspect-square flex items-center justify-center mb-6 relative"
          >
            {/* Ambient glow behind GIF */}
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <img 
              src="/ai-animation-white.gif" 
              alt="AI Upgrade Visualizer" 
              className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.08)]"
            />
          </motion.div>

          {/* Code-details card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-semibold text-zinc-400 font-mono tracking-wider">DIAGNOSTICS</span>
              </div>
              <span className="text-[11px] font-mono bg-zinc-800/50 text-zinc-300 px-2 py-0.5 rounded">
                CODE: {statusCode}
              </span>
            </div>

            <h3 className="text-lg font-bold text-zinc-200 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              {title}
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
              {message}
            </p>

            {errorDetails && (
              <div className="border border-zinc-800/60 bg-zinc-950 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/60 hover:bg-zinc-900 border-b border-zinc-800/40 transition-colors text-zinc-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  <span>{showDetails ? 'Hide technical logs' : 'Show technical logs'}</span>
                  <span className="text-zinc-500 font-mono text-[9px]">
                    {showDetails ? '▲' : '▼'}
                  </span>
                </button>

                {showDetails && (
                  <div className="p-3.5 relative">
                    <button
                      onClick={handleCopyDetails}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Copy error details"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <pre className="text-zinc-400 text-[10px] sm:text-xs font-mono overflow-auto max-h-48 pr-6 whitespace-pre-wrap leading-normal select-text">
                      {errorDetails}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/40 pt-6 mt-10 relative z-10 text-xs text-zinc-500 font-mono">
        <span>Legacy Life Builder © 2026</span>
        <div className="flex gap-4">
          <a href="/terms" className="hover:underline hover:text-zinc-400">Terms</a>
          <a href="/privacy" className="hover:underline hover:text-zinc-400">Privacy</a>
        </div>
      </footer>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by react-error-boundary:', error, errorInfo);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorPage error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}
