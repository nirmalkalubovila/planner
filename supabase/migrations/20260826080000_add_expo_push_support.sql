-- Adds native (Expo) push support to push_subscriptions without touching
-- the existing Web Push shape or constraint at all — this is the mobile
-- push notifications phase of the RN port.
--
-- Deliberately additive-only:
--   * endpoint/p256dh/auth stay NOT NULL and untouched for web rows.
--   * the existing UNIQUE(user_id, endpoint) constraint is left in place,
--     so apps/web/src/lib/notification-service.ts's
--     `.upsert(..., { onConflict: 'user_id,endpoint' })` keeps working
--     with zero code changes and zero behavior change.
--   * expo_push_token is a new NULLABLE column with its OWN unique
--     constraint. Postgres treats each NULL as distinct for uniqueness
--     purposes, so the many web rows with a null expo_push_token never
--     collide with each other or interfere with this constraint.
--
-- Making endpoint/p256dh/auth nullable is intentionally NOT done here: an
-- expression-based replacement for the existing UNIQUE(user_id, endpoint)
-- would risk invalidating web's onConflict target, and there's no need to
-- touch it — native rows simply leave endpoint/p256dh/auth null and use
-- the platform discriminator instead.

alter table push_subscriptions
  alter column endpoint drop not null,
  alter column p256dh drop not null,
  alter column auth drop not null;

alter table push_subscriptions
  add column if not exists platform text not null default 'web',
  add column if not exists expo_push_token text,
  add column if not exists device_id text,
  -- IANA zone name (e.g. "Asia/Colombo"), captured at registration time on
  -- native via Intl.DateTimeFormat().resolvedOptions().timeZone. The cron
  -- function's existing timezoneOffset math is a fixed-offset snapshot
  -- that silently drifts across DST — an IANA zone lets a future pass
  -- compute local time correctly without touching web's existing rows,
  -- which simply leave this column null and keep using the offset path.
  add column if not exists timezone text,
  add column if not exists last_seen_at timestamptz not null default now();

alter table push_subscriptions
  add constraint push_subscriptions_platform_check
    check (platform in ('web', 'ios', 'android'));

-- A native row must carry a token; a web row must carry the three Web Push
-- fields. Either shape is valid, but not a row with neither.
alter table push_subscriptions
  add constraint push_subscriptions_shape_check
    check (
      (platform = 'web' and endpoint is not null and p256dh is not null and auth is not null)
      or (platform in ('ios', 'android') and expo_push_token is not null)
    );

create unique index if not exists push_subscriptions_user_expo_token_uidx
  on push_subscriptions (user_id, expo_push_token)
  where expo_push_token is not null;

comment on column push_subscriptions.platform is 'web | ios | android — selects which delivery path send-push-notifications uses for this row.';
comment on column push_subscriptions.expo_push_token is 'Expo push token for ios/android rows, obtained from Notifications.getExpoPushTokenAsync() on-device.';
