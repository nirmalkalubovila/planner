---
name: goal-intake
description: Create a goal in Legacy Life Builder properly. Use when the user wants a new goal, says "add a goal", or describes something they want to achieve over weeks, months or years. Interviews them for every required field, then builds the full year, month and week breakdown.
---

# Goal intake

Goals created here must be as complete as ones made in the app's goal form. Never create a goal with a missing or guessed field.

## 1. Read first
Call `get_goals` and `get_profile`. If a similar goal exists, say so and ask whether to extend it instead of duplicating it.

## 2. Collect all of these, in plain text
Ask only for what is still unknown, one short question at a time. Never invent an answer.

| Field | What to ask |
|---|---|
| `title` | A short name, 60 characters max. Offer one if they ramble. |
| `currentState` | Where are you today, with real numbers if there are any. |
| `ultimateGoal` | What does done look like. |
| `constraints` | Time, money, energy, rules. Use the profile's hour budget as a starting point. |
| `why` | Why this matters to you. It is shown back to them when it gets hard. |
| dates and type | Start date, end date. Week goal 1-4 weeks, Month goal 2-12 months, Year goal 2-10 years. |
| `bucket` | income, asset, recovery or relational. Suggest one, let them confirm. |

Write every value as plain text: no HTML entities such as `&amp;`, and no "Current State:" style labels inside the values.

## 3. Check realism
If the goal cannot reasonably fit the time or the hour budget, say so plainly and propose a longer span or a smaller target before creating it.

## 4. Build the breakdown
- Year goal: a phase per year, each with its months, and the weeks of the current month.
- Month goal: a phase per month, with the weeks of the current month.
- Week goal: weeks only.
- Every title is concrete and measurable. Put numbers in titles and descriptions, spread any numeric target across the periods, and keep estimated hours below the daily budget times the days in the period.

Call `create_goal`. If it rejects a count, the error lists the exact periods expected: fix and call again.

## 5. Finish
Offer to schedule the first week's work (use the `weekly-review-and-plan` skill). Do not place blocks without being asked. Tell the user in two lines what was created.
