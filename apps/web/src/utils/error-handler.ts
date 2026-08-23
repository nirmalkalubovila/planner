import { toast } from 'sonner';

/**
 * Handles error display by converting developer-biased errors (e.g. network/fetch failures)
 * into friendly, user-biased alerts when offline or unable to connect.
 */
export const handleFriendlyError = (err: any, fallbackMessage: string) => {
  const errMsg = err?.message || String(err || '');
  const isOffline = !navigator.onLine || 
                    errMsg.includes('Failed to fetch') || 
                    errMsg.includes('NetworkError') || 
                    errMsg.includes('network') || 
                    errMsg.includes('fetch');

  if (isOffline) {
    toast.error("Connection Offline: Changes will sync once your internet connection is restored.");
  } else {
    toast.error(`${fallbackMessage}: ${errMsg}`);
  }
};
