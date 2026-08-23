// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/utils/time` imports keep working unchanged.
export {
  timeToMinutes,
  minutesToTime,
  isTimeOverlapping,
  isSleepOverlapping,
  timeToSlot,
  slotKey,
  slotToTime,
} from '@llb/core';
