import React from 'react';

/**
 * Wraps a React.lazy import to catch chunk load failures (which often happen after a deployment
 * because old chunk files are removed or have different hashes) and reloads the page once to get the new chunks.
 */
export function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    componentImport().catch((error) => {
      // Check if this error was already handled to prevent infinite reloads
      const hasReloaded = window.sessionStorage.getItem('page-reloaded-on-error');

      if (!hasReloaded) {
        window.sessionStorage.setItem('page-reloaded-on-error', 'true');
        window.location.reload();
      }

      return Promise.reject(error);
    })
  );
}
