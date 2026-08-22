# Fit Rubric — Customer Success roles for Daniel Pinzon

Used by the scheduled ingestion agent to score each job posting 1-5
(decimals allowed, e.g. 4.9). Referenced directly in the scheduled task's
prompt — this file is the source of truth; update here first, then update
the scheduled task's prompt to match.

Scoring works from whatever the RSS-captured title/company/location/
description contains. The agent cannot reliably fetch the live LinkedIn
posting, so every factor below must be assessable from that captured text
alone — don't assume more detail is available than what's on the page.

## Fit Reasoning content (what actually displays under each listing)

`Fit Reasoning` is shown directly under the fit score in the webapp — it's
what Daniel actually reads when browsing listings. It should primarily be
a **1-2 sentence summary of the company and the role** (what the company
does/sells, and what the role actually involves — scope, seniority,
account type), not an explanation of how the score was computed. Don't
walk through the rubric factors or cite point values.

A hard disqualifier, thin/low-confidence data, or the Unity bonus can
still be noted, but only as a short trailing clause after the summary
(e.g. "— disqualified: on-site outside Canada" or "— Unity bonus
applied"), never as the main content. If a company/role can't be
meaningfully summarized from the available text (e.g. a very thin
ASGC-style listing), a brief factual description is still preferable to a
scoring explanation.

## Candidate profile (context, not restated in output)

8+ years in B2B SaaS/gaming Customer Success & Partner Relations. Currently
Manager, Partner Relations at Unity Technologies — leads a team of 5, owns a
$6M+ ARR / 50-account strategic portfolio, NRR 100.9%. Career history: Manager,
Partner Advisors (built/led team of up to 10, <2% churn); Customer Success
Specialist; Customer Success Manager at a smaller SaaS company (Veevart).
Strengths: strategic/enterprise account management, executive stakeholder
relationships, team building/coaching/hiring, revenue retention & NRR, upsell/
expansion, CRM & platform implementation (Salesforce), LATAM market, bilingual
English/Spanish. Based in Montreal, QC, Canada. Ideally CAD 120-160K+ base,
remote or hybrid — see Factor 3 for the full location ranking (remote and
Ottawa on-site/hybrid rank highest; hybrid elsewhere is next; on-site Toronto
or Montreal is acceptable but weaker; on-site anywhere else is disqualifying).
No preference on company stage/size (startup vs. enterprise
is fine either way). **Tech-only — see the hard disqualifiers below**: not
interested in any role outside tech/tech-adjacent companies, regardless of
how strong the role itself looks. Open to both people-management roles and
strong individual-contributor Account Management / CSM roles — see the
scoring philosophy below.

## Scoring philosophy

The score is a **sum of weighted factors**, not a lookup into hard tiers.
This is deliberate: a posting that's strong on scope but weak on comp should
land somewhere between a clean 5 and a clean 3, not get force-fit into
whichever bullet list it resembles most. Build the score bottom-up from the
four factors below, then apply the leadership/IC modifier last.

1. **Account Scope & Seniority** — 0 to 2.0 points (the primary driver)
2. **Compensation** — 0 to 1.0 point
3. **Location** — 0 to 0.7 point (on top of the hard disqualifiers, which
   already remove the worst locations entirely)
4. **Function Fit** — 0 to 0.3 point

```
Base score = 1.0 + Scope/Seniority + Compensation + Location + Function Fit
Final score = Base score + Leadership/IC modifier + Contract/Term modifier
              + Unity bonus (clamp to [1.0, 5.0])
```

Whether the role is IC or people-management is deliberately **not** one of
the four weighted factors — it's a separate small tie-breaker applied at the
end (max ±0.1), because a senior individual-contributor role with real
enterprise scope and strong comp should score just as well as an equivalent
people-management role.

## Unity bonus (apply last, alongside the other modifiers — not an override)

If the hiring company is Unity (Unity Technologies, Unity Software, or a
Unity-owned brand/subsidiary — e.g. Unity Ads, Unity Growth, ironSource
under the Unity umbrella):

- Score the posting normally against every factor below, including the
  hard disqualifiers — a Unity posting is **not** exempt from location,
  comp, or function scoring, and can still land at 1.0 if it's genuinely a
  poor fit (e.g. an on-site role somewhere disqualifying).
- After computing the normal final score (weighted factors + Leadership/IC
  modifier + Contract/Term modifier), add a flat **+0.5** Unity bonus,
  then clamp to [1.0, 5.0].
- Set the `Unity Priority` flag true on the Job Listings row regardless of
  the resulting score (see architecture docs for the property) — the flag
  marks "this is Unity," not "this scored well."
- `Fit Reasoning` should still lead with the role/company summary (see the
  "Fit Reasoning content" section above); append "— Unity bonus applied"
  as a short trailing note, not the main content.

This is deliberate and not a normal scoring judgment: Daniel holds a
closed work permit tied specifically to Unity, and returning to the
company through any open role is one of the most direct paths to
resolving that status — worth a meaningful boost regardless of function or
seniority, but not so large that it should be indistinguishable from an
actually great-fit role at another company. The `Unity Priority` flag (not
the score) is what the webapp uses to sort these to the very top and
exempt them from auto-archiving, so under-scoring one doesn't mean it gets
buried or cleaned up — see the webapp section of `docs/architecture.md`.

## Hard disqualifiers (score = 1, regardless of anything else)

Apply these first, before computing anything below (the Unity bonus above
is added after this, not instead of it). If any apply, stop and score 1 —
do not run the weighted factors.

- Fully on-site with no remote/hybrid option, UNLESS the on-site location is
  Ottawa, Toronto, or Montreal (or their immediate metro areas) — treat any
  other city/country as a disqualifying on-site requirement. (See Factor 3
  for how these three cities are ranked differently from each other and from
  remote/hybrid — being exempt from this hard gate doesn't mean they score
  the same.)
- Requires relocation outside Canada, or requires being physically based/
  working from outside Canada.
- Requires US work authorization / US-only remote (no Canada option).
- Stated base salary (if listed) below CAD 100,000.
- **Not a tech or tech-adjacent company** (added per explicit direction —
  this is a strict filter, not a preference). In scope: software/SaaS/
  tech-platform companies (including gaming/game engines, dev tools, ad
  tech, cybersecurity, data/analytics platforms), and tech-enabled
  companies in adjacent spaces where the core product/service is
  fundamentally delivered via technology (e.g. fintech, healthtech,
  e-commerce/marketplace platforms, other tech-first business models).
  Out of scope: traditional banks/insurers/wealth management, traditional
  retail/manufacturing, traditional healthcare providers/hospitals,
  consultancies/agencies whose core business isn't technology, traditional
  real estate/construction/energy/utilities, government/public sector,
  and similar. Judge by what the company actually builds or sells, not
  whether it uses technology internally — a bank's own tech/digital team
  is still a bank. When genuinely ambiguous from the posting text alone,
  lean toward disqualifying rather than guessing tech-adjacent status.

## Factor 1 — Account Scope & Seniority (0 – 2.0 points)

The single biggest driver of the score. Judge by the *actual described
scope*, not the title — a "Senior CSM" with a thin book and a "Manager" with
a huge one should be scored on their books, not their labels.

- **2.0 — Enterprise/strategic scope.** Portfolio is enterprise/strategic
  accounts with meaningful ARR (ideally $3M+) and executive/C-suite
  relationship ownership. Title tier (Manager, Senior Manager, Director,
  Head, VP, Principal, Senior/Strategic CSM, or similar) confirms rather
  than drives this.
- **1.2 – 1.8 — Strong mid-market or growing-scope role.** Meaningful account
  ownership and clear seniority, but scope is mid-market rather than
  enterprise, or ARR/account count implies solid-but-not-huge scope, or the
  posting reads as a credible step up without being clearly enterprise-tier.
- **0.5 – 1.1 — SMB or unclear scope.** Some real account ownership exists
  (not purely transactional), but it's SMB-weighted, high-volume/low-touch,
  or the description doesn't give enough to confirm scope beyond "has
  accounts."
- **0 – 0.4 — Junior or no real scope.** Entry-level (e.g. "Onboarding
  Specialist," "Customer Success Associate") with no path to owning a real
  book of business, or a description too thin to identify any account
  ownership at all. Applies regardless of IC vs. people-management — the
  problem is seniority/scope, not org structure.

## Factor 2 — Compensation (0 – 1.0 point)

- **1.0** — CAD 130K+ base stated, or the role is clearly senior enough
  (Director+, or Factor 1 already at 2.0) to safely imply it even if
  unstated.
- **0.6 – 0.9** — Base stated in the CAD 115K–130K range, or comp unstated
  but scope/seniority moderately implies this band.
- **0.2 – 0.5** — Base stated at or near the CAD 100K floor (100K–115K), or
  genuinely unclear and scope doesn't strongly imply better.
- **0** — Should not normally happen if salary is stated, since anything
  under CAD 100K is a hard disqualifier; reserve 0 for cases where
  comp is implied to be low by an otherwise-junior role that Factor 1 has
  already scored near 0.

If salary is not listed, do not auto-disqualify — infer from seniority/scope
and say "salary unconfirmed" in the reasoning.

## Factor 3 — Location (0 – 0.7 point)

The hard disqualifiers already remove non-Canada and most out-of-city onsite
roles. This factor ranks what's left. Remote is the top tier on its own —
Ottawa is the one city where onsite/hybrid matches remote; everywhere else,
onsite ranks below hybrid.

- **0.7 — Top tier.** Remote, anywhere in Canada. Also onsite *or* hybrid in
  Ottawa specifically — treat Ottawa on-site as equal to remote, not merely
  exempt from the hard disqualifier.
- **0.5 — Hybrid.** Hybrid anywhere else in Canada (Montreal, Toronto, or
  elsewhere), at a reasonable in-office cadence (up to ~3 days/week).
- **0.3 — Onsite in Toronto or Montreal.** Acceptable but the weakest
  non-disqualifying tier — meaningfully behind remote or hybrid, not a peer
  to them.
- **0.2** — Location is ambiguous/unstated and nothing signals a
  disqualifying location (e.g. company is Canadian but posting doesn't say
  remote/hybrid/onsite). Flag as low-confidence per the section below.

A fully on-site role anywhere other than Ottawa, Toronto, or Montreal is a
hard disqualifier (see above) — it never reaches this factor.

## Factor 4 — Function Fit (0 – 0.3 point)

Named lists to reduce case-by-case guessing on ambiguous titles. This is
deliberately a small factor — it's a modest signal on top of Factor 1, not a
gate. A role with real account ownership should already score well on Factor
1 regardless of its function label; this factor only fine-tunes.

**Counts as in-scope CS/AM-equivalent function** (full 0.3, subject to
Factor 1 still judging actual scope): Customer Success, Account Management,
Key Account Management (KAM), Partner Relations/Partner Success, Client
Success, Customer Experience roles with account-ownership responsibilities,
Renewal Management, Business Development roles that include ongoing account
ownership/expansion (not pure net-new hunting).

**Borderline — score 0.1 to 0.2, let Factor 1 carry the weight**: Revenue
Operations, Customer Experience roles that are support/ops-focused rather
than relationship-owning, titles like "Merchant Success Manager" or other
marketplace/e-commerce CS variants (score on scope/seniority/location/comp
like any other industry, no title penalty or bonus).

**Out-of-scope function — score 0**: pure new-logo/net-new sales or business
development roles with no ongoing account ownership, generic Product
Management, and roles in unrelated functions entirely (e.g. banking
operations, generic project management) that have no customer-relationship
or account-ownership component at all. Note this is a scoring input, not a
hard disqualifier — an out-of-scope function score of 0 here simply removes
0.3 points; Factor 1 (which will also likely score low for these, since they
typically lack describable account scope) does the real work of pushing the
total down.

## Leadership/IC modifier (apply last, small nudge only — max ±0.1)

- If the role is genuinely people-management (3+ direct reports, matching
  his current scope), add up to +0.1 to the base score.
- If the role is a strong individual-contributor role with no direct
  reports, apply at most -0.1. Do NOT suppress IC roles further than this —
  a great senior/strategic IC role that scores near-max on Factors 1-4
  should land around 4.9, not be artificially pushed down.
- A people-manager title with a small or unclear team (1-2 reports) doesn't
  need the full +0.1 — use judgment on how close it is to his current scope
  (3+ reports, multi-million-dollar ARR portfolio).
- This modifier is a tie-breaker only; it's capped at ±0.1 specifically so
  it can never be the difference between, e.g., a 4.95 and a 5.05 rounding
  into a different impression of fit.

## Contract/Term modifier (apply alongside the Leadership/IC modifier)

- Default assumption, if not stated otherwise, is a permanent/full-time
  role — no adjustment.
- If the posting explicitly states it's a fixed-term contract, temporary
  role, or leave coverage (e.g. "14-month contract," "maternity leave
  coverage," "temporary"), apply a penalty:
  - **-0.2** for a longer contract (roughly 12+ months stated).
  - **-0.3 to -0.4** for a shorter or unspecified-length contract.
- Unlike the Leadership/IC modifier, this one is not capped at ±0.1 — a
  fixed-term role is a real, meaningful downgrade from the permanent
  equivalent, not a fine-tuning nudge.

## Handling thin/low-confidence descriptions

The RSS-captured description is sometimes a short snippet rather than the
full posting. When scope, comp, or location genuinely can't be assessed from
the text (not merely "not the ideal scenario," but actually unassessable):

- Score each unassessable factor conservatively at the low end of its range
  rather than guessing high, per the guidance already given per-factor
  (e.g. "salary unconfirmed" defaults per Factor 2, location-unstated
  defaults to 0.2 per Factor 3).
- `Fit Reasoning` should still lead with whatever role/company summary can
  be pieced together (see "Fit Reasoning content" above); append a short
  trailing note like "— thin description, scored conservatively" so a low
  score from missing information doesn't read identically to a low score
  from a confirmed poor fit.

## Notes for the scorer

- Compute Factors 1-4 independently even though they interact loosely (e.g.
  a Director-title role nudges the Compensation estimate) — don't let a
  strong score on one factor inflate your estimate of another beyond what
  the text actually supports.
- Round the final score to one decimal place.
