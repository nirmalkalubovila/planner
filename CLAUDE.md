# Legacy Life Builder - project rules

## Design rule: it must always feel premium

Every screen, component, animation and line of copy should feel premium. Treat this as a requirement, not a preference.

- **Palette:** black surfaces with the Legacy gold `#D2A226` as the single accent (soft `#e9c468`, deep `#8a6415`). Keep other colors semantic only (goal, habit, warning, destructive).
- **Copy:** short and to the point. Two lines or fewer on mobile. No pressure wording ("won't last"), no emoji, no name-dropping other brands, no stock-photo cliches.
- **Motion:** restrained. Fade/rise, slow shimmer, one calm attention cue at most. Transform and opacity only, play once where possible, and always respect `prefers-reduced-motion`.
- **Consistency:** reuse the existing components (`StandardDialog`, `FormField`, `OptionChips`, `Button`, `Reveal`) and spacing instead of one-off styles. Same section rhythm, same radius, same labels.
- **Readability first:** never ship text that is hard to read (for example dark gold on black). Check contrast, and check mobile.
- **No icons and no emojis in new UI.** Use clear text labels, numbers and typographic marks instead (for example "Show / Hide" rather than a chevron, a plain "01" rather than a badge icon). If an existing screen needs an icon for a functional control (navigation, close, delete), keep it minimal and do not add decorative ones. Never put an emoji in copy, buttons, toasts or emails.
- **No clutter:** if an element does not help the user, remove it.

## Conventions

- Type-check with `node node_modules/typescript/bin/tsc --noEmit` from each package (npm scripts can fail to spawn on this machine).
- Supabase schema changes go in `supabase/migrations/` as additive, idempotent SQL.
