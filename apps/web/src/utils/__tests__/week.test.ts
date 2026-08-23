import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WeekUtils } from '@/utils/week';

// Golden-value tests: capture today's WeekUtils behavior for fixed inputs so a
// later refactor (moving this into @llb/core, de-DOM-ing, etc.) can be
// verified to have changed nothing. Values below were captured from the
// actual implementation, not hand-derived, since its week-numbering scheme
// (ISO-like but not quite ISO-8601) is easy to get subtly wrong by hand.
//
// Dates are compared via local calendar components (not toISOString/UTC) to
// match how the app actually displays them (formatWeekDisplay uses
// toLocaleDateString) and to keep these tests stable regardless of the
// machine/CI runner's timezone.

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('WeekUtils', () => {
  describe('getWeekFromDate', () => {
    it('computes the year-week for a plain date string', () => {
      expect(WeekUtils.getWeekFromDate('2026-01-01')).toBe('2026-01');
      expect(WeekUtils.getWeekFromDate('2026-08-23')).toBe('2026-34');
      expect(WeekUtils.getWeekFromDate('2026-12-31')).toBe('2026-53');
    });

    it('accepts a Date object', () => {
      expect(WeekUtils.getWeekFromDate(new Date(2026, 7, 23))).toBe('2026-34');
    });

    it('returns empty string for an invalid date', () => {
      expect(WeekUtils.getWeekFromDate('not-a-date')).toBe('');
    });
  });

  describe('parseWeek / normalizeWeek', () => {
    it('parses a week string into year/week', () => {
      expect(WeekUtils.parseWeek('2026-34')).toEqual({ year: 2026, week: 34 });
    });

    it('normalizes a non-padded week string', () => {
      expect(WeekUtils.normalizeWeek('2026-5')).toBe('2026-05');
      expect(WeekUtils.normalizeWeek('2026-34')).toBe('2026-34');
    });
  });

  describe('parseDay', () => {
    it('parses a dayStr into year/week/day', () => {
      expect(WeekUtils.parseDay('2026-34-3')).toEqual({ year: 2026, week: 34, day: 3 });
    });
  });

  describe('addWeeks', () => {
    it('adds weeks within the same year', () => {
      expect(WeekUtils.addWeeks('2026-10', 5)).toBe('2026-15');
    });

    it('rolls over into the next year past week 52', () => {
      expect(WeekUtils.addWeeks('2026-50', 5)).toBe('2027-03');
    });

    it('rolls back into the previous year below week 1', () => {
      expect(WeekUtils.addWeeks('2026-02', -5)).toBe('2025-49');
    });

    it('subtracts weeks within the same year', () => {
      expect(WeekUtils.addWeeks('2026-34', -1)).toBe('2026-33');
    });
  });

  describe('compareWeeks', () => {
    it('orders by year first, then week', () => {
      expect(WeekUtils.compareWeeks('2026-10', '2026-20')).toBeLessThan(0);
      expect(WeekUtils.compareWeeks('2026-20', '2026-10')).toBeGreaterThan(0);
      expect(WeekUtils.compareWeeks('2025-52', '2026-01')).toBeLessThan(0);
      expect(WeekUtils.compareWeeks('2026-10', '2026-10')).toBe(0);
    });
  });

  describe('getDaysForWeek', () => {
    it('returns 7 consecutive local dates for a known week', () => {
      const dates = WeekUtils.getDaysForWeek('2026-34');
      expect(dates).toHaveLength(7);
      expect(dates.map(localISO)).toEqual([
        '2026-08-17',
        '2026-08-18',
        '2026-08-19',
        '2026-08-20',
        '2026-08-21',
        '2026-08-22',
        '2026-08-23',
      ]);
    });
  });

  describe('formatWeekDisplay', () => {
    it('formats a week within a single month', () => {
      expect(WeekUtils.formatWeekDisplay('2026-35')).toBe('Aug 24 - Aug 30, 2026');
    });

    it('formats a week that spans two calendar years', () => {
      expect(WeekUtils.formatWeekDisplay('2026-53')).toBe('Dec 28, 2026 - Jan 3, 2027');
    });
  });

  describe('getCurrentWeek / getCurrentDay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 23, 12, 0, 0)); // 2026-08-23, a Sunday
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('derives the current week from the system clock', () => {
      expect(WeekUtils.getCurrentWeek()).toBe('2026-34');
    });

    it('derives the current day (Sunday maps to day 7)', () => {
      expect(WeekUtils.getCurrentDay()).toBe('2026-34-7');
    });
  });
});
