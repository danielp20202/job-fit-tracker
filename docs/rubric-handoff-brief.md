# Fit Rubric — Full Detail & Context

For an agent being asked to review/enhance the scoring rubric used by this
project. This doc gives full context on what the rubric is, how it's
actually used in production, and the rubric text itself. Nothing here
prescribes what "enhancing" should mean — that's left open for you to
propose, based on the goals and constraints described below.

## What this is

job-fit-tracker is a personal job-search pipeline for Daniel Pinzon, a
Customer Success / Partner Relations professional based in Montreal,
Canada. It continuously pulls Customer Success / Account Management job
postings from LinkedIn (via RSS feeds + webhooks) and, a few times a day, a
scheduled agent scores every new posting against this rubric — a 1.0-5.0
fit score with a one-sentence reasoning — before publishing it to a Notion
database that a webapp displays, sorted best-fit-first.

The rubric is the entire "judgment" layer of the pipeline: everything
upstream (RSS capture, webhook delivery, Notion storage) is mechanical and
rubric-agnostic. The rubric is what turns a raw job posting into a decision
about whether it's worth Daniel's time.

## How it's actually used, mechanically

- The rubric text below is embedded **verbatim** inside the prompt of a
  scheduled cloud agent (not code — a Claude Code "routine" created via the
  `/schedule` feature). That agent has no memory between runs; the rubric
  text is the only thing it knows about what a "good fit" means, each time
  it runs.
- Input to scoring: for each new job posting, the agent has the raw title,
  company, location, and a description field pulled from the RSS feed
  (often fairly complete job-posting text, sometimes just a snippet). It
  does **not** have reliable access to the live LinkedIn posting — network
  restrictions in the agent's sandbox block fetching the original URL, so
  the rubric has to be appliable from the RSS-captured text alone. Any
  enhancement should keep this constraint in mind: don't design scoring
  criteria that assume you can always fetch more detail than what's in the
  captured description.
- Output: a `Fit Score` (1.0–5.0, decimals allowed) and a one-sentence
  `Fit Reasoning`, written to Notion alongside the listing.
- The rubric is also duplicated in this repo at `docs/fit-rubric.md` as the
  "source of truth" copy — if you propose changes, that file should be
  updated first, then the live routine's prompt updated to match (a
  separate step, not part of what you're asked to do here).

## Candidate profile

8+ years in B2B SaaS/gaming Customer Success & Partner Relations. Currently
Manager, Partner Relations at Unity Technologies — leads a team of 5, owns a
$6M+ ARR / 50-account strategic portfolio, NRR 100.9%. Career history:
Manager, Partner Advisors (built/led team of up to 10, <2% churn); Customer
Success Specialist; Customer Success Manager at a smaller SaaS company
(Veevart). Strengths: strategic/enterprise account management, executive
stakeholder relationships, team building/coaching/hiring, revenue retention
& NRR, upsell/expansion, CRM & platform implementation (Salesforce), LATAM
market, bilingual English/Spanish. Based in Montreal, QC, Canada. Ideally
CAD 120-160K+ base, remote or hybrid. No preference on company stage/size
(startup vs. enterprise is fine either way). No strong industry preference
beyond a slight lean toward tech/SaaS-adjacent companies — the rubric
explicitly does not penalize other industries. Open to both
people-management roles and strong individual-contributor Account
Management / CSM roles.

## Rubric history worth knowing (so you don't accidentally re-introduce
issues that were deliberately fixed)

- **Industry is explicitly not penalized.** Earlier drafts leaned toward
  SaaS/gaming; Daniel corrected this — score other industries on role/
  seniority/location/comp merits alone.
- **IC-vs-management is a small tie-breaker (±0.1), not a tier gate.**
  Earlier drafts required a people-leadership title for a 5 and capped
  individual-contributor roles at 3. Daniel corrected this explicitly: a
  strong senior IC role with real account scope should score comparably to
  an equivalent manager role. The score should be driven by account scope,
  role seniority, comp, and location — not organizational structure.
- **Company stage/size is explicitly not a factor** (no preference between
  startup and enterprise).
- Hard disqualifiers exist and should probably stay hard gates regardless
  of any enhancement (see below) — they encode genuine deal-breakers
  (location/relocation/work-authorization/pay floor), not soft preferences.

## The rubric (current, in production)

---RUBRIC START---

## Hard disqualifiers (score = 1, regardless of anything else)

- Fully on-site with no remote/hybrid option, UNLESS the on-site location is
  Montreal, QC (or immediate area) — treat any other city/country as a
  disqualifying on-site requirement.
- Requires relocation outside Canada, or requires being physically based/
  working from outside Canada.
- Requires US work authorization / US-only remote (no Canada option).
- Stated base salary (if listed) below CAD 100,000.

## Scoring philosophy

The score is driven primarily by **account/portfolio scope, seniority of
the role itself, compensation, and location** — NOT by whether the role
formally includes direct reports. A senior individual-contributor role with
real enterprise scope and strong comp should score just as well as an
equivalent people-management role. Whether the role is IC or
people-management is only a small tie-breaker (see "Leadership/IC
modifier" below), worth at most 0.1 points — it should never be the
difference between tiers.

## Score 5 — Excellent fit

- Senior/strategic-level role — title can be Manager, Senior Manager,
  Director, Head, VP, Principal, Senior CSM, Strategic CSM, or similar; the
  title label matters far less than the actual scope described below.
- Portfolio is enterprise/strategic accounts with meaningful ARR scope
  (ideally $3M+) and executive/C-suite relationship ownership.
- Location: remote (Canada) or hybrid in/near Montreal (up to 2-3 days/week
  in office).
- Salary CAD 130K+ base if listed, or clearly senior enough to imply it.
- Bonus signals (not required): gaming/dev-tools/platform company; bilingual
  EN/ES or LATAM market exposure valued; CRM/Salesforce ownership.

## Score 3 — Acceptable / worth a look

- A solid, senior-enough role with one meaningful gap from a 5: SMB/
  mid-market account scope rather than enterprise, OR salary meets the
  CAD 100K floor but isn't clearly above ~120K, OR the move reads as
  lateral rather than clear growth.
- Location is remote (Canada) or hybrid.

## Score 1 — Poor fit (but not caught by a hard disqualifier above)

- Junior/entry-level role — e.g. "Onboarding Specialist," "Customer
  Success Associate" — with no path to ownership of a real book of
  business or meaningful account scope. This applies regardless of whether
  the role is IC or has direct reports; the problem is seniority/scope,
  not org structure.
- SMB-only, transactional, high-volume/low-touch accounts with no
  strategic or executive component.
- Compensation clearly below CAD 100K where stated (if not already caught
  by the hard disqualifier because salary wasn't explicit).
- Vague/thin job description with no discernible seniority, account scope,
  or leadership component, and nothing else in the posting signals fit.

## Leadership/IC modifier (apply last, small nudge only — max ±0.1)

- If the role is genuinely people-management (3+ direct reports, matching
  his current scope), add up to +0.1 to whatever score the criteria above
  produced.
- If the role is a strong individual-contributor role with no direct
  reports, apply at most -0.1. Do NOT cap IC roles at 3 — a great senior/
  strategic IC role with enterprise scope, strong comp, and the right
  location should land around 4.9, not be artificially pushed down.
- This modifier fine-tunes within a tier only. It should never be large
  enough to move a role from one tier to another (e.g. never enough to turn
  a 5-tier role into a 3-tier score).

## Notes for the scorer

- If salary is not listed, do not auto-disqualify — infer from seniority/
  scope and note "salary unconfirmed" in the reasoning.
- Treat "Merchant Success Manager" and similar marketplace/e-commerce CS
  titles on their individual merits (scope/seniority/location/comp), same as
  any other industry — no penalty or bonus for the industry itself.
- A people-manager title with a small or unclear team (1-2 reports) doesn't
  need the full +0.1 — use judgment on how close it is to his current scope
  (3+ reports, multi-million-dollar ARR portfolio).

---RUBRIC END---

## Known gaps / open questions (worth your attention)

- **Score 2 and Score 4 are implicit, not explicitly defined.** The rubric
  only spells out 5/3/1 criteria; the scorer is left to infer 2 and 4 as
  "between" tiers. A recent real run produced several score-2 listings
  (e.g. "solid IC role, comp/location fine, but weaker account scope than a
  3") without explicit guidance for what separates a 2 from a 1 or a 3.
  Worth considering whether 2 and 4 deserve their own explicit criteria.
- **No explicit guidance on ambiguous/adjacent titles** beyond the
  "Merchant Success Manager" example — e.g. "Client Success," "Customer
  Experience," "Revenue Operations," "Renewal Manager" show up regularly in
  the real feed data and the rubric doesn't say how seriously to weigh
  title-adjacency vs. actual described scope.
- **Real-world scoring data exists** if useful context: a recent live run
  scored 31 real postings, with 27 landing at 1 and 4 at 2 — entirely
  driven by role/function mismatch (Sales, BD, Product, banking roles that
  got swept in by loose keyword matching upstream, not rubric failures).
  That run is a reasonable sample of what "genuinely bad fits" look like in
  practice, if it's useful to see the distribution the current rubric
  produces.
