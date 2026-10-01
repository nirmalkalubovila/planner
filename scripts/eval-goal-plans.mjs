#!/usr/bin/env node
// Runs the landing-page example goals through the real AI function and checks what comes back.
//
//   Dry run (no network, prints what the AI would be asked):
//     node scripts/eval-goal-plans.mjs --dry
//
//   Live (calls the deployed generate-ai-plan function with a test account):
//     SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... EVAL_EMAIL=... EVAL_PASSWORD=... \
//       node scripts/eval-goal-plans.mjs
//
// Add --all to include the "More ideas" chips. It uses the same prompt builder, reality check and output
// checks as the app, so a pass here means the app would accept the plan.

import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');
const all = process.argv.includes('--all');

// Bundle the app's own logic (TypeScript) so this script cannot drift from it
const out = join(mkdtempSync(join(tmpdir(), 'llb-eval-')), 'core.mjs');
writeFileSync(join(tmpdir(), 'llb-eval-entry.ts'), `export * from ${JSON.stringify(join(root, 'packages/core/src/index.ts').replace(/\\/g, '/'))};`);
await build({ entryPoints: [join(tmpdir(), 'llb-eval-entry.ts')], outfile: out, bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const core = await import(pathToFileURL(out).href);
const {
    PRIMARY_GOAL_CHIPS, ALL_GOAL_CHIPS, assessGoalRealism, buildMasterPlanPrompt, checkMasterPlan, getDailyHourBudget, monthsToGoalDuration,
} = core;

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Milestones like the app creates: one per month for month goals, one per year for year goals. */
function milestonesFor(start, months) {
    const { goalType, durationValue } = monthsToGoalDuration(months);
    const dates = [];
    if (goalType === 'Year') for (let y = 1; y <= durationValue; y++) dates.push(new Date(start.getFullYear() + y, start.getMonth(), start.getDate()));
    else for (let m = 1; m <= (goalType === 'Month' ? durationValue : 1); m++) dates.push(new Date(start.getFullYear(), start.getMonth() + m, start.getDate()));
    return dates.map((d, i) => ({ id: String(i + 1), title: `Milestone ${i + 1}`, targetDate: iso(d), completed: false }));
}

// A typical user: a student or employee with about two free hours a day
const profile = { primaryLifeFocus: 'Career and money', currentProfession: 'Employee', dailyFreeHours: '2', energyPeakTime: 'Morning', focusAbility: 'normal', taskShiftingAbility: 'normal' };

let token = null;
if (!dry) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY, EVAL_EMAIL, EVAL_PASSWORD } = process.env;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EVAL_EMAIL || !EVAL_PASSWORD) {
        console.error('Live mode needs SUPABASE_URL, SUPABASE_ANON_KEY, EVAL_EMAIL and EVAL_PASSWORD. Use --dry to see the prompts only.');
        process.exit(1);
    }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EVAL_EMAIL, password: EVAL_PASSWORD }),
    });
    token = (await res.json()).access_token;
    if (!token) { console.error('Could not sign in with that account.'); process.exit(1); }
}

// Words a realistic plan should not contain
const PROMISES = /\b(guarantee[sd]?|definitely|100% (?:sure|certain)|effortless|overnight)\b/i;
const FLUFF = /\b(stay motivated|believe in yourself|never give up|keep going|you got this)\b/i;

let failures = 0;
for (const chip of all ? ALL_GOAL_CHIPS : PRIMARY_GOAL_CHIPS) {
    const start = new Date();
    const milestones = milestonesFor(start, chip.months);
    const goal = {
        title: chip.text.slice(0, 60), name: `Current State:\nTypical situation\n\nUltimate Goal:\n${chip.text}`, purpose: 'Strict Constraints:\nAbout 2 free hours a day',
        startDate: iso(start), endDate: milestones[milestones.length - 1].targetDate, milestones,
    };
    const feasibility = assessGoalRealism({ text: `${goal.title} ${goal.name}`, months: chip.months });
    const prompt = buildMasterPlanPrompt({ goal, profile, todayLabel: start.toDateString(), feasibility });
    const budget = getDailyHourBudget(profile);

    console.log(`\n=== ${chip.text}  (${chip.months} months, ${milestones.length} milestones)`);
    console.log(`reality check: ${feasibility ? `${feasibility.level} - ${feasibility.detail}` : 'nothing measurable'}`);
    if (feasibility && feasibility.level !== 'ok') { failures++; console.log('FAIL: this example is not realistic for its own timeline'); }
    if (dry) { console.log(`prompt: ${prompt.length} characters, asks for ${milestones.length} milestones`); continue; }

    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/generate-ai-plan`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    const raw = await res.json();
    const checked = checkMasterPlan(raw, milestones.map((m) => m.targetDate), goal.startDate, budget.max);
    const problems = [...checked.issues.map((i) => `repaired: ${i}`)];
    if (checked.fatal) problems.push('FATAL: the plan was unusable');

    checked.slots.forEach((s, i) => {
        const text = `${s.dayTask} ${s.description}`;
        if (PROMISES.test(text)) problems.push(`milestone ${i + 1} promises a result`);
        if (FLUFF.test(text)) problems.push(`milestone ${i + 1} has motivational filler`);
        if (!/\d/.test(text)) problems.push(`milestone ${i + 1} has no number or measurable finish`);
    });
    // New income cannot start in the first period
    if (/earn|income/i.test(chip.text) && checked.slots[0] && /LKR\s*\d{2,}/i.test(`${checked.slots[0].dayTask}`) && /earn|revenue|income/i.test(checked.slots[0].dayTask)) {
        problems.push('milestone 1 expects income before the business has started');
    }
    if (/LKR/i.test(chip.text) && !checked.slots.some((s) => /LKR|Rs/i.test(`${s.dayTask} ${s.description}`))) problems.push('the goal is in LKR but the plan never uses it');

    checked.slots.forEach((s, i) => console.log(`  ${i + 1}. [${s.date}] ${s.dayTask}  (${s.estimatedHours ?? '?'}h)\n     ${s.description}`));
    const hard = problems.filter((p) => !p.startsWith('repaired'));
    if (hard.length) failures++;
    console.log(problems.length ? `  checks: ${problems.join('; ')}` : '  checks: all passed');
    console.log(hard.length ? '  RESULT: FAIL' : '  RESULT: PASS');
}

console.log(`\n${failures === 0 ? 'All examples passed.' : `${failures} example(s) need attention.`}`);
process.exit(failures === 0 ? 0 : 1);
