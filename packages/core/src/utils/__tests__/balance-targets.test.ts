import { describe, it, expect } from 'vitest';
import { computeBucketTargets, ageFromDob, BALANCE_GUARDRAILS, STATUS_BASELINES } from '../balance-targets';
import { getSituationStatuses, situationSummary } from '../situation';
import { calculateBucketBalanceScores, type BucketStats } from '../bucket-engine';

const pct = (n: number) => Math.round(n * 1000) / 10;

describe('computeBucketTargets', () => {
  it('uses the status baseline when age is unknown', () => {
    const t = computeBucketTargets({ statuses: ['business_owner'] });
    expect([t.shares.income, t.shares.asset, t.shares.recovery, t.shares.relational].map(pct)).toEqual([30, 16, 34, 8]);
    expect(pct(t.plannedShare)).toBe(88);
    expect(t.hours.income).toBeCloseTo(50.4, 1);
  });

  it('moves asset building up for a young student (24% to 29%)', () => {
    const t = computeBucketTargets({ statuses: ['student'], age: 22 });
    expect(pct(t.shares.asset)).toBe(29);
    expect(pct(t.shares.income)).toBe(6);
  });

  it('keeps a young business owner near 30% income (28 or more) and 17 to 20% asset, within the planned-time cap', () => {
    // The age shift would take the planned total past 88%, so the building buckets are scaled back a little
    const t = computeBucketTargets({ statuses: ['business_owner'], age: 27 });
    expect(pct(t.shares.asset)).toBeGreaterThanOrEqual(17);
    expect(pct(t.shares.asset)).toBeLessThanOrEqual(20);
    expect(pct(t.shares.income)).toBeGreaterThanOrEqual(28);
    expect(pct(t.shares.income)).toBeLessThanOrEqual(32);
    expect(pct(t.plannedShare)).toBeLessThanOrEqual(88.1);
    expect(pct(t.shares.recovery)).toBe(34);
  });

  it('averages several statuses', () => {
    const t = computeBucketTargets({ statuses: ['student', 'business_owner'] });
    expect([t.shares.income, t.shares.asset].map(pct)).toEqual([19, 20]);
  });

  it('never lets recovery fall under its guardrail or relationships vanish', () => {
    for (const status of Object.keys(STATUS_BASELINES) as (keyof typeof STATUS_BASELINES)[]) {
      for (const age of [18, 27, 40, 55, 70]) {
        const t = computeBucketTargets({ statuses: [status], age });
        expect(pct(t.shares.recovery)).toBeGreaterThanOrEqual(BALANCE_GUARDRAILS.minRecovery);
        expect(pct(t.shares.relational)).toBeGreaterThanOrEqual(BALANCE_GUARDRAILS.minRelational);
        expect(pct(t.plannedShare)).toBeLessThanOrEqual(BALANCE_GUARDRAILS.maxPlanned + 0.5);
        expect(pct(t.plannedShare)).toBeGreaterThanOrEqual(BALANCE_GUARDRAILS.minPlanned - 0.5);
      }
    }
  });

  it('falls back to a neutral target with no status', () => {
    const t = computeBucketTargets({ statuses: [] });
    expect([t.shares.income, t.shares.asset].map(pct)).toEqual([18, 18]);
  });
});

describe('ageFromDob', () => {
  it('counts whole years and rejects bad input', () => {
    expect(ageFromDob('2000-06-15', new Date('2026-06-14'))).toBe(25);
    expect(ageFromDob('2000-06-15', new Date('2026-06-15'))).toBe(26);
    expect(ageFromDob('nope')).toBeNull();
    expect(ageFromDob(undefined)).toBeNull();
  });
});

describe('situation', () => {
  it('reads the new list, and older single statuses', () => {
    expect(getSituationStatuses({ situation: { statuses: ['student', 'business_owner'] } })).toEqual(['student', 'business_owner']);
    expect(getSituationStatuses({ situation: { status: 'unemployed' } })).toEqual(['between_jobs']);
    expect(getSituationStatuses({ situation: { status: 'employed' } })).toEqual(['employed']);
    expect(getSituationStatuses(undefined)).toEqual([]);
    expect(situationSummary(['student', 'caregiver'])).toBe('Student, Homemaker / Caregiver');
  });
});

describe('balance scores against a target', () => {
  const stats = (h: Partial<Record<'income' | 'asset' | 'recovery' | 'relational', number>>) =>
    ({ bucketHours: { income: 0, asset: 0, recovery: 0, relational: 0, ...h } } as unknown as BucketStats);

  it('scores 10 once the target is met, and not higher for more', () => {
    const targets = computeBucketTargets({ statuses: ['student'], age: 22 }); // asset 29% = 48.7h
    const s = calculateBucketBalanceScores(stats({ asset: 48.7, recovery: 200 }), targets.shares);
    expect(s.asset).toBe(10);
    expect(s.recovery).toBe(10);
  });

  it('is fair to a student: 40h of asset building is near full marks, but only 8 of 10 against an equal quarter', () => {
    const targets = computeBucketTargets({ statuses: ['student'], age: 22 });
    const personal = calculateBucketBalanceScores(stats({ asset: 40 }), targets.shares).asset;
    const equal = calculateBucketBalanceScores(stats({ asset: 40 })).asset;
    expect(personal).toBe(8);
    expect(equal).toBe(10);
  });

  it('still works without targets (equal quarters)', () => {
    expect(calculateBucketBalanceScores(stats({ income: 21 })).income).toBe(5);
  });
});
