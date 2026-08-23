// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/types/vault` imports keep working unchanged.
//
// NOTE: CATEGORY_META still embeds Tailwind class strings (color, bgClass)
// inside @llb/core — a known Phase 3 cleanup, not fixed here to keep this
// move behavior-neutral.
export {
  VAULT_CATEGORIES,
  type VaultCategory,
  type VaultNote,
  type VaultFilter,
  CATEGORY_META,
} from '@llb/core';
