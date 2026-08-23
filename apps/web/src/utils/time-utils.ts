// Re-export for backward compatibility. New code should import from
// '@llb/core' (time) directly.
export {
  timeToMinutes,
  minutesToTime,
  isTimeOverlapping,
  isSleepOverlapping,
  timeToSlot,
  slotKey,
  slotToTime,
} from '@llb/core';
