// A notifier port so shared business logic can surface toasts without
// depending on any specific UI toast library (sonner on web, something
// else on native). Each app registers its real implementation once at
// startup via setNotifier(); until then, calls are silently no-ops.
export interface ToastOptions {
  description?: string;
  /** A short icon hint (e.g. an emoji or icon name) — purely advisory, each app's adapter decides how to render it. */
  icon?: string;
  action?: { label: string; onClick: () => void };
}

export interface Notifier {
  default(message: string, options?: ToastOptions): void;
  success(message: string, options?: ToastOptions): void;
  error(message: string, options?: ToastOptions): void;
  info(message: string, options?: ToastOptions): void;
}

const noop: Notifier = {
  default() {},
  success() {},
  error() {},
  info() {},
};

let impl: Notifier = noop;

export function setNotifier(notifier: Notifier): void {
  impl = notifier;
}

/**
 * Named `toast` and shaped like sonner's `toast` on purpose: every call site
 * that used to `import { toast } from 'sonner'` can import this instead with
 * no other changes — including the bare `toast('message', opts)` call form
 * (sonner's neutral toast) and the `toast.success/error/info(msg, opts)`
 * forms with a description/action/icon.
 */
type ToastFn = ((message: string, options?: ToastOptions) => void) & Notifier;

const toastFn = ((message: string, options?: ToastOptions) => {
  impl.default(message, options);
}) as ToastFn;

toastFn.default = (message, options) => impl.default(message, options);
toastFn.success = (message, options) => impl.success(message, options);
toastFn.error = (message, options) => impl.error(message, options);
toastFn.info = (message, options) => impl.info(message, options);

export const toast: ToastFn = toastFn;
