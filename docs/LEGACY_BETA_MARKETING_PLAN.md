# Legacy Life Builder: free beta to paid product

Prepared 1 October 2026. Audience: Sri Lankan students and young professionals. Language: conversational Sinhala-English, with English captions and professional posts. This is a proposed four-week organic campaign; targets are experiments, not forecasts. No posts, messages, forms, or campaigns have been submitted.

## The decision

Invite people to use Legacy Life Builder for one real goal over seven days. Help them reach a first useful result, learn where they struggle, and ask for honest feedback. Introduce payment after repeat use and a reliable product justify it.

Campaign name: **One Goal. One Week.**

Public invitation: **Pick one goal. Plan this week. Try Legacy Life Builder free in public beta. Tell me what helped and what needs work.**

The seven days describe the recommended experiment, not an announced expiry of free access. Do not imply a seven-day payment trial or promise free access forever.

## 1. What I verified on your sites

### Product site

The [current product homepage](https://www.legacylifebuilder.xyz/) explains goal planning, habits, weekly execution, Reset, testimonials, and free public beta access. It now includes a Legacy Life section and a link to your personal roadmap. The outbound link contains `utm_source=legacy_life_builder&utm_medium=landing`.

The public offer says no card is needed. “Get Started” leads to a [login screen](https://www.legacylifebuilder.xyz/login) headed “Welcome Back,” with a separate Sign up link. I inspected that screen without creating an account.

There are three distinct testimonial entries in the page content, repeated by the carousel. One entry describes a consistency milestone in third-person language. That is a weaker customer story than a user's own description of what changed; it should not be presented as an independently verified customer quote without confirmation.

Reset is advertised on the current homepage and now exists in the local source. Its presence is verified; the full production apply/undo flow was not tested. Film and validate the exact shipped flow before making it the campaign's central promise.

### Personal site

The [Legacy Life roadmap](https://my-site-tawny-alpha.vercel.app/legacy-life) teaches six pillars and nine steps. It is explicitly relevant to young Sri Lankans. It offers a free 41-page roadmap, quizzes, and coaching.

I found no direct Legacy Life Builder link in that page's rendered links. The connection back to the app currently goes through the navigation:

**Legacy Life → Tools → Legacy Life Builder → product site.**

The [Tools page](https://my-site-tawny-alpha.vercel.app/tools) includes an Open App link. The [dedicated tool page](https://my-site-tawny-alpha.vercel.app/tools/legacy-life-builder) explains the app well and has several free-beta calls to action. Those external links currently use `https://www.legacylifebuilder.xyz/?bypass=true`, without acquisition UTMs. `bypass=true` is a landing-page routing flag, not campaign attribution or a signup shortcut.

The roadmap form displays name, WhatsApp number, email, age, and a WhatsApp updates checkbox. The inspected inputs did not expose HTML `required` attributes; I did not submit the form, so server-side requirements and delivery remain unverified.

Your sites use different TikTok and LinkedIn profile URL variants. Verify the canonical profiles and align the links; I have not concluded that any particular variant is broken.

## 2. Give each site one role

| Destination | Job | Primary next step |
|---|---|---|
| Personal brand and Legacy Life page | Explain the philosophy and earn trust | Choose a practical first step |
| Personal site's product page | Explain how the app implements part of the system | Start free |
| Product homepage | Demonstrate the app and answer product questions | Create an account |
| App | Help someone complete useful work | Return and plan another week |

The app supports planning and execution within the broader personal system. Do not suggest that downloading it delivers financial independence, business ownership, health, or all six pillars by itself.

### Two audience journeys

**Ready to try a tool:** product demonstration → product site → signup → one goal → three scheduled blocks → first completion.

**Interested in your philosophy:** personal-brand content → roadmap → “Put this into practice this week” → app. The book and quiz remain optional paths, not prerequisites for using the planner.

### Website changes before the campaign

1. Add a short app invitation directly below Step 03, Build the Personal System, and near the end of the roadmap. Suggested copy: “Put this into practice this week. Choose one goal and turn it into scheduled work with Legacy Life Builder. Free in public beta.” Button: “Plan My First Week.”
2. Make new-user CTAs open the signup experience. Keep a clear Log in route for returning users. Verify goal prefill and source attribution survive signup and Google authentication.
3. Add a 30–45 second real demonstration close to the product hero: goal → week → today. Use a demo account with fictional tasks for public recordings.
4. Explain the beta plainly: free now, still improving, future paid options announced before any charge. Do not promise an unapproved lifetime deal.
5. Make the roadmap delivery form lighter. Ask for the delivery details genuinely needed; defer age and WhatsApp collection unless they support a clear user benefit. Keep book delivery separate from optional marketing updates.
6. Replace milestone-status filler with confirmed customer words. Add role, use case, and time using the app only when verified and approved.
7. Preserve tracked inbound sources and align social profile links. A personal custom domain can improve recognition later, but should not delay a small beta test.

Do not alter the sites as part of this document. These are implementation recommendations.

## 3. Audience and message

Primary segment: university students, interns, and early-career professionals, roughly 18–30, trying to complete a portfolio, study plan, skill course, content project, or side project around existing commitments. This is a starting segment to validate.

Use two demonstrations:

- Student: “Complete the first version of my portfolio,” with three realistic work sessions.
- Young professional: “Make progress on my side project after work,” with fixed work hours and recovery time respected.

Message hierarchy:

1. A familiar moment: Sunday planning looks clear; Monday arrives and the next action is unclear.
2. A visible mechanism: choose a goal, break it down, allocate time, open Today's Schedule.
3. A small invitation: use it for one real goal this week.
4. Honest beta expectations: feedback shapes what gets improved.

Avoid “unbeatable,” “guaranteed success,” unsupported time-saving percentages, psychological diagnoses, or claims that the app automatically knows everything about a person's capacity. Let the demonstration carry the claim.

## 4. Channel priorities and research

DataReportal's Digital 2026 Sri Lanka report estimates 9.00 million social-media user identities in October 2025, TikTok potential advertising reach of 6.79 million adults, and Instagram potential ad reach of 2.25 million. These are different platform measures, not counts of unique reachable buyers or proof of organic performance. They support testing Sinhala-English short video; your own activated-user data should decide the eventual channel mix. [Source](https://datareportal.com/reports/digital-2026-sri-lanka)

| Priority | Channel | Role and realistic cadence |
|---|---|---|
| Primary | TikTok | Three original Sinhala-English demonstrations a week |
| Primary | Instagram Reels and Facebook Reels | Adapt the same three clean recordings; review captions and CTA for each |
| Primary | WhatsApp | Status plus requested onboarding conversations; no contact-list blast |
| Supporting | LinkedIn | Two founder/student-career posts a week, including one real demo |
| Supporting | YouTube | Reuse three Shorts; publish one clear walkthrough initially |
| Optional | Threads and X | Repurpose one lesson or question; two posts a week combined |
| Optional | Reddit, Discord, Telegram | Relevant communities where promotion is allowed; disclose that you built it |
| Later | Pinterest and Snapchat | Use the provided adaptations only if you already have an audience |

This supplies copy across the major platforms without requiring twelve separate content operations. Allocate roughly 5–7 hours weekly: two hours recording/editing, one hour adaptation, two hours conversations/onboarding, and one to two hours reviewing results and feedback.

Platform details:

- TikTok profile website links have eligibility and regional limits. Verify your account before using “link in bio”; otherwise invite an interested viewer to request the link. [TikTok guidance](https://support.tiktok.com/en/getting-started/setting-up-your-profile/linking-another-social-media-account?lang=hi)
- YouTube Shorts description/comment URLs are not clickable. Use a channel profile link or a related walkthrough video, where available. [YouTube guidance](https://support.google.com/youtube/answer/13748639?hl=en)
- Use readable captions and keep key video content away from interface overlays. LinkedIn supports uploaded video captions. Review Sinhala captions manually. [LinkedIn guidance](https://www.linkedin.com/help/linkedin/answer/a7494039)
- For WhatsApp Business outreach, obtain opt-in and respect requests to stop. A number entered to receive a book is not automatically permission for every later promotional message. [WhatsApp policy](https://whatsappbusiness.com/policy/)

No paid ads in the initial plan. No budget or historical conversion data was provided. Consider a capped experiment only after activation is working and you can measure cost per activated user.

## 5. Four-week campaign

| Week | Publish | Recruit and support | Learn | Dependency |
|---|---|---|---|---|
| 1: First useful week | Three clips: the problem, student demo, founder invitation; two LinkedIn posts | Invite a small group of relevant warm contacts; offer up to five short onboarding sessions | Observe first-use friction and collect baseline goals | Signup path, source tracking, and demo verified |
| 2: Make use easier | Three clips: first setup, fitting work around commitments, one actual fix | Check in with users who agreed to follow-up; invite a second cohort | Why people did or did not return | Fix week-one blockers before increasing volume |
| 3: Show evidence | One approved customer story if available; two practical demos | Ask all eligible users for neutral feedback, including those who stopped | Which use cases produce repeated use | Written permission for any public quote |
| 4: Validate value | Three clips: product improvement, founder lesson, one-week invitation | Interview repeat users about value and price; invite a small paid pilot only if ready | Renewal interest and reasons to pay | Billing and product reliability verified before charging |

Reusable weekly rhythm: Monday problem clip; Wednesday demonstration; Friday founder update or approved user story; Sunday a practical weekly-planning reminder. Supporting text posts come from the same recordings. Test publishing times against your own account insights; no universal best time is assumed.

First-week assets: one demo account, three vertical clips, one 2–3 minute walkthrough, one five-slide carousel, pinned invitation post, updated bio link, onboarding checklist, feedback questions, and a simple cohort tracker. The accompanying script pack contains the copy.

## 6. Onboarding and feedback sequence

**Day 0:** Ask which goal they want to work on. Help them create one goal and schedule three feasible blocks. Let them choose whether to receive follow-ups.

**Day 2:** Ask where setup or execution got confusing. Solve one concrete problem. Do not ask for praise.

**Day 7:** Ask what they planned, what they actually completed, what helped, and what got in the way. Ask users who stopped what made them stop.

**Day 8–10:** For someone who has an experience to share, ask whether you may quote their exact words. Confirm name, role, photograph, and channels separately. A useful critical account is feedback even when it is unsuitable as promotional material.

**Day 14:** Ask whether they planned another week and whether they would be disappointed to lose the tool. Explore payment with repeat users, without treating hypothetical willingness as a purchase.

The local feedback form currently starts at five stars and uses suggestion chips to compose text; publication consent is shown for high ratings. Before expanding testimonial collection, start with an unselected rating, use neutral prompts, let users edit freely, and keep publication permission off until deliberately chosen. Label a promotional selection as selected user stories, rather than implying it represents all ratings.

Never write a customer result for them or reward only positive reviews. The US FTC's guidance prohibits sentiment-conditioned review incentives where its rules apply; regardless of jurisdiction, neutral collection and clear permission are the appropriate design for this campaign. [FTC guidance](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)

## 7. Measure adoption, not just signups

Proposed four-week operating targets, to revise after the first cohort:

| Metric | Definition | Initial target |
|---|---|---|
| New signups | New genuine beta accounts from the campaign | 50 |
| Activated users | Within 72 hours: one goal, three scheduled blocks, and at least one task completion | 30 of 50 |
| Day-seven return | An activated user performs a meaningful planning/completion action on days 5–9 | 18 of 30 eligible activated users |
| Second-week use | Meaningful action on days 8–14 | 12 users from cohorts old enough to measure |
| Feedback conversations | Answers about a real usage experience, including non-returners | 10 |
| Approved public stories | Specific, authentic accounts with permission | Aim for 5; do not pressure users to meet a quota |

Report retention only for cohorts that have reached the measurement window. A login or page view alone is not meaningful use. Publish no success rate without its definition, period, denominator, and evidence.

Suggested events: landing view, app CTA click, signup completed, goal created, first plan saved, first task completed, week returned, feedback submitted, testimonial permission granted. Record source and timestamps; do not send goal text or private task contents into marketing analytics.

Example campaign link:

[TikTok beta invitation](https://www.legacylifebuilder.xyz/?utm_source=tiktok&utm_medium=organic_social&utm_campaign=one_goal_one_week&utm_content=student_demo_01)

Use sources such as instagram, facebook, youtube, linkedin, whatsapp, and nirmal_site. Add placement-specific `utm_content`. Preserve the original acquisition source separately when a reader moves through the personal site; do not overwrite it with every internal referral. UTMs alone do not prove tracking works: test attribution through signup and authentication.

Maintain a private tracker with a user identifier, cohort start, source, activation date, return date, main friction, follow-up preference, and quote permission. Review every Sunday. Expand the source that creates returning users.

## 8. Introduce payment when earned

Do not set “30 days passed” as the launch trigger. Use these proposed gates:

- Two matured cohorts show repeat use; the user stories explain a concrete benefit.
- Important save, completion, scheduling, and Reset recovery paths work reliably.
- Ten repeat users have discussed value and alternatives with you.
- A small number voluntarily buy an explicitly described pilot after seeing the price.
- Account cancellation, access changes, support, and payment handling have been tested.

For research, explore a Sri Lankan monthly price around **LKR 990–1,490** as an unvalidated hypothesis. First ask what they use and pay for today and what benefit they would pay to retain. Do not announce this as the price until AI usage, infrastructure, payment costs, taxes, support effort, and payment-provider eligibility are understood.

Start with one paid offer. Decide whether basic manual planning remains free or whether there is a trial before drafting final terms. Keep existing user data accessible and explain migration clearly. Proposed notice period: at least 30 days. No automatic conversion from free beta without explicit purchase consent.

Suggested sequence: announce the intended paid offering → show included features and price → invite a small voluntary pilot → observe actual payment and continued use → expand. Free-beta users should understand what changes and what happens if they decline.

## 9. Risks to watch

| Risk | Response |
|---|---|
| People like the idea but never plan a week | Shorten onboarding and observe five real first-use sessions |
| Signups grow while repeat use is low | Reduce promotion and fix the main abandonment cause |
| The philosophy overwhelms a first-time visitor | Offer a direct one-goal product path alongside the full roadmap |
| Marketing outruns the feature | Record current behavior; describe limits; avoid promises derived only from headlines |
| Founder workload becomes unsustainable | Batch three recordings and cap personal onboarding sessions |

## Start here

1. Align the roadmap-to-app link and new-user signup CTA.
2. Verify one first-goal workflow and prepare a safe demo account.
3. Publish the Sinhala-English invitation from the script pack.
4. Invite the first ten suitable users and help them start.
5. Review activation and friction before recruiting the next group.

The first commercial asset to build is a group of people who return because the app helps them complete something they care about.
