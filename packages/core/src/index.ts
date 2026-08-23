// @llb/core — platform-agnostic domain types, business logic engines, and
// constants shared between the web app and the future React Native app.
//
// Rule: nothing in this package may import react-dom, DOM globals
// (window/document/localStorage/navigator), `import.meta`, or Tailwind
// class strings. tsconfig.json deliberately omits the "DOM" lib so any
// accidental DOM reference fails `npm run typecheck -w @llb/core`.

export * from './types/database.types';
export * from './types/domain';
export * from './types/planner';
export * from './types/time';
export * from './types/vault';
export * from './types/notification-types';

export * from './constants/scheduling';

export * from './utils/week';
export * from './utils/time';
export * from './utils/color';
export * from './utils/bucket-engine';
export * from './utils/analytics-engine';
export * from './utils/milestone-engine';
export * from './utils/insights-engine';
export * from './utils/error-handler';

export * from './platform/notifier';
export * from './platform/kv';
export * from './platform/net';
