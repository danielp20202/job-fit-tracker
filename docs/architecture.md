# Architecture

job-fit-tracker is a personal job-search pipeline for Daniel Pinzon. It pulls
Customer Success / Account Management job postings from LinkedIn and from
ASGC's game-industry job board, scores each one against Daniel's fit rubric,
and displays the results in a mobile-first webapp. Everything runs unattended
except reviewing the results.

## Pipeline overview

```
LinkedIn searches (multiple, via rss.app)        ASGC job board API
        │  rss.app polls, diffs against                 │  Vercel Cron, once/day (this
        │  what it last saw                              │  repo — has full internet
        ▼                                                │  access, unlike the sandboxed
rss.app webhooks (fire on new items only)                │  scoring routine below)
        │  POST with items_new[]                          │  filters to Canada + Customer
        ▼                                                │  & Community Support, dedupes,
POST /api/webhooks/rss  (this repo, on Vercel)            │  writes structured rows
        │  verifies HMAC-SHA256 signature                │
        ▼                                                ▼
        └──────────────────► Notion — "Job Inbox" database ◄──────────────────┘
                              (unprocessed, unscored)
                                        │
                                        │  scheduled cloud routine, 3x/day
                                        ▼
                        Notion — "Job Listings" database
                        (scored, deduped, lifecycle-managed)
                                        │
                                        │  getListings() — server component,
                                        │  revalidate every 5 min
                                        ▼
                Webapp at job-fit-tracker.vercel.app
                (list / detail / filters / archive)
```

## Why a webhook instead of polling

Each rss.app feed caps at a limited number of items ("posts per feed," plan-
dependent). Polling on a fixed schedule risks missing postings that get
pushed out of the feed's cap between polls — a real problem discovered early
on with a broad "customer success" search producing ~8 new postings/hour.
Webhooks solve this: rss.app pushes each new item the moment it's detected,
independent of feed-cap truncation or how often anything else runs. This
decouples **capture** (real-time, cheap, always-on) from **scoring**
(batched, 3x/day, the actual cost driver).

This doesn't apply to the ASGC source (see component 3 below), which is
polled daily instead — it has no feed-cap truncation risk (the API always
returns the complete dataset, not a capped recent-items window) and the
site itself states it's only "Updated Daily," so daily polling loses
nothing a webhook would have caught sooner.

## Components

### 1. LinkedIn search feeds (via rss.app)

LinkedIn's job search moved to an LLM-driven natural-language query model —
structured filter params (`f_E`, `f_WT`, etc.) are largely ignored by the
current UI. Effective filtering now happens by writing the `keywords` field
as a natural-language description rather than a short keyword phrase.

Both feeds use `location=Canada`, `f_TPR=r10800` (postings from the last 3
hours), and `sortBy=DD` (most recent first):

- **CS leadership**: `Manager, Senior Manager, Director, Head, or VP of
  Customer Success roles, remote or hybrid in Canada`
- **Account Management**: `Strategic Account Manager or Enterprise Account
  Manager roles, remote or hybrid in Canada` (IC-level is in scope — Daniel
  is open to individual-contributor Account Management roles, not just
  people-management)

Each is wrapped into an RSS feed via rss.app (Basic plan: 25 posts/feed, 15
feeds total, 2 webhook *endpoints*). A webhook endpoint can have multiple
feeds attached to it — the real cap on how many searches can feed the
pipeline is the 15-feed limit, not the 2 webhooks. Both currently-live feeds
(CS leadership, Account Management) are attached to one webhook endpoint,
pointing at this repo's receiver; the second webhook endpoint is still
available for more feeds.

### 2. Webhook receiver — `src/app/api/webhooks/rss/route.ts`

`POST /api/webhooks/rss`. Verifies the `RSSApp-Signature` header, then
parses `data.items_new[]` from the payload and writes each item into the
Notion "Job Inbox" database.

**Signature scheme (learned the hard way — not documented anywhere public
at the time this was built):** rss.app's docs only say "HMAC-SHA256 via
the `RSSApp-Signature` header," which reads like a raw hex digest of the
body. It's actually a Stripe-style scheme: the header is
`t=<unix_timestamp>,v1=<hex>`, and `v1` is
`HMAC-SHA256(secret, "${t}.${rawBody}")` — the timestamp is concatenated
into the signed content, not just carried alongside it, and exists for
replay protection (this implementation rejects anything with a timestamp
more than 10 minutes old). Diagnosed by temporarily logging the actual
request headers/body from a live rss.app test delivery — Vercel's default
access logs don't include either, so that requires an explicit
`console.log` in the route handler and `vercel logs --expand` to read it
back. Worth remembering if this ever needs re-diagnosing: a 401 with a
*correct* secret almost certainly means a scheme mismatch, not a bad
secret — verify by fetching a real request's headers before assuming the
secret is stale.

No scoring happens in this route — it's intentionally cheap and does
nothing but capture.

### 3. ASGC poller — `src/lib/asgc.ts`, `src/app/api/cron/asgc-poll/route.ts`

A second, independent Job Inbox source: ASGC's game-industry job board
(https://jobs.asgc.gg/). Added because it's relevant (games-industry CS
roles line up with Daniel's Unity/gaming background) but had no way to
filter via rss.app — investigated directly and confirmed the site is a
client-rendered SPA where every filter (category, location, etc.) is
applied in the browser only; neither the page URL nor its backing
`/api/job-listings` JSON endpoint honor any filter query params — both
always return the entire dataset (~68K rows, ~39MB as of this writing).
There's no filtered URL to hand an RSS scraper, so this bypasses rss.app
entirely:

- A Vercel Cron job (`vercel.json`, daily at 13:00 UTC) hits
  `/api/cron/asgc-poll`, protected by a `CRON_SECRET` bearer token Vercel
  sends automatically once that env var is set.
- The route fetches the full ASGC dataset (the webapp has unrestricted
  outbound internet access, unlike the sandboxed scoring routine below —
  this is the same reason the archive API route can talk to Notion
  directly), filters client-side in code for `overallCategory ===
  "Customer & Community Support"` AND `country === "Canada"` (~40 listings
  at any given time, not the full 835 global Customer & Community Support
  count — Daniel wanted this source scoped to Canada only), and maps each
  match into the same shape the rss.app webhook produces.
- Dedup: before writing, it queries Job Inbox for every URL already
  ingested under this feed's `Feed Title` (`getInboxUrlsForFeed()` in
  `src/lib/notion.ts`) and only creates pages for URLs not already present
  — cheap since this feed's total volume is small and grows slowly.
- ASGC's API doesn't expose real posting description text, so the
  `Description` written to Job Inbox is a short, explicitly labeled
  synthetic one (`Company: X`, `Location: Y — On-site/Hybrid/Remote`,
  `Job Type`, `Experience`) rather than scraped prose — the scoring
  routine's prompt was updated to recognize rows from this feed (by
  `Feed Title` starting with "ASGC") and read the labels directly instead
  of trying to LinkedIn-parse them, and treats their thin description as
  the normal low-confidence case the rubric already handles.

### 4. Notion — "Job Inbox" database

Staging area, fed by both the rss.app webhook and the ASGC poller above.
Schema: Title, URL, Description, Date Published, Feed Title, Processed
(checkbox), Received At. Data source id:
`0c47226a-b5f5-45e2-9864-e8f882893535`.

### 5. Scheduled cloud routine — `job-fit-tracker-scorer`

Not code in this repo — a cloud routine created via Claude Code's
`/schedule` feature (`RemoteTrigger` API), routine id
`trig_01FTJ1yeDbuggBpQzf8VEb5E`, viewable at
https://claude.ai/code/routines/trig_01FTJ1yeDbuggBpQzf8VEb5E. Fires 3x/day
(`0 4,12,20 * * *` UTC = 12am/8am/4pm America/Toronto). Each run is a fresh,
isolated cloud session with no memory of prior runs or this repo — the
entire task (data source IDs, both schemas, the full fit rubric, and every
step) is self-contained in the routine's prompt.

**Environment reality (discovered by watching a real run fail and adapt,
not by reading docs):**
- This sandbox blocks most outbound internet access. `curl` to
  `api.notion.com` fails outright (network egress blocked) — the original
  design called for calling Notion's REST API directly via `curl`, which
  simply doesn't work here.
- A Notion MCP connector *is* attached to the routine's session regardless
  (visible in the `mcp_connections` on the trigger, contrary to what
  `/schedule` initially reported as available) — the routine now uses its
  tools (`notion-query-data-sources`, `notion-create-pages`,
  `notion-update-page`) directly instead of `curl`. This is also a security
  improvement: no raw Notion bearer token needs to live in the prompt text
  anymore.
- `WebFetch` to LinkedIn is also blocked (`EGRESS_BLOCKED`) — full-posting
  fetches for accurate Work Mode/Pay are impossible in this sandbox. Not
  actually a loss: the Job Inbox `Description` field already contains rich,
  often near-complete job description text from rss.app's own payload (one
  observed item was 26K+ characters), so scoring reads that instead.
- Notion's `query-data-sources` MCP tool has a workspace usage limit that
  can be hit mid-run on a large batch — the routine is instructed to
  minimize query calls (select only needed columns, no `SELECT *` on Job
  Inbox given how large `Description` can get) and proceed with whatever
  data it has rather than block on a retry.

Each run:

1. Queries Job Inbox for unprocessed rows.
2. Queries Job Listings for existing `Link` values, bounded to pages added
   in the last 14 days (a fixed-cost dedup lookup regardless of how large
   Job Listings grows over time — real duplicates would only ever appear
   within a day or two given the feeds' 3-hour freshness window; the 14-day
   window is a safety margin for pipeline gaps, not an expected reprocessing
   case).
3. Skips anything already in that set (marks it Processed, doesn't rescore).
4. Parses title/company/location from the raw feed text, and extracts Work
   Mode/Pay/Company Link from the Description text where mentioned.
5. Scores every non-duplicate item 1.0-5.0 (decimals allowed) against the
   rubric (embedded verbatim from `docs/fit-rubric.md` — keep both in sync
   if the rubric changes). Scoring is driven by account scope, role
   seniority, comp, and location; whether the role is people-management or
   a strong individual-contributor role is only a ±0.1 tie-breaker, not a
   tier gate (see the rubric's "Leadership/IC modifier" section — this was
   a deliberate correction from an earlier draft that capped IC roles at 3).
6. Publishes results to Job Listings in large batches (up to 100
   pages/call), not one page at a time.
7. Marks every processed Inbox row.
8. Tags listings `Stale` if `Date Posted` is >7 days old.
9. Archives listings >13 days old (age-based) and, separately, listings
   scoring below 2.0 that are >2 days old (fast-archive for confidently
   poor-fit roles) — both by setting the `Archived` checkbox, not Notion's
   native trash (see the "Archived" property note below and the webapp
   section's Archive tab).

### 6. Notion — "Job Listings" database

The scored, canonical dataset the webapp reads. Schema: Title, Company,
Company Link, Location, Work Mode (select), Pay, Link, Date Posted, Date
Added (created_time), Fit Score (1.0-5.0, decimals allowed), Fit Reasoning, Status (select —
manually edited by Daniel in Notion; New/Reviewed/Applied/Rejected/Ignored),
Source Guid, Stale (checkbox), Visa Sponsorship (checkbox — detected by the
scoring routine from explicit mentions in the posting text only, defaults
false; rare by design), Unity Priority (checkbox — set true whenever the
hiring company is Unity, per the Unity bonus in `docs/fit-rubric.md`. This
is a bonus, not an override: the posting is still scored normally against
every rubric factor and hard disqualifier, then gets a flat +0.5 added at
the end (clamped to 5.0) — a disqualified Unity posting can still land at
1.5, it isn't rescued to a top score. The flag is set regardless of the
resulting score; it means "this is Unity," not "this scored well."
Personal context, not a general product decision: Daniel holds a closed
work permit tied specifically to Unity, so any open Unity role is worth a
meaningful boost as a path back, regardless of function/seniority fit —
just not an automatic 5. Unity-flagged listings are also exempt from both
the age-based auto-archive (step 9) and the low-score fast-archive (step
9a), regardless of their score — everything else can go stale/archive on
schedule, these don't), Archived (checkbox — a custom soft-archive flag, not
Notion's native trash; Notion's public API has no reliable way to query
pages moved to native trash via a regular integration, so this project uses
a plain checkbox instead. Set by the scoring routine's age/score-based
housekeeping, or manually from the webapp's Archive button; either way it's
reversible with one click from the webapp's Archive tab). Data source id:
`fa5209fd-9b4e-49fe-bfbe-f6f3fbc0c69f`. Both databases live under the
[Job Search](https://app.notion.com/p/3c1800d538a7814da15ec4ae519b0f00)
page.

### 7. Webapp — this repo

Next.js 16 (App Router) + TypeScript + Tailwind v4, deployed on Vercel at
https://job-fit-tracker.vercel.app, auto-deploying from `main` via the
GitHub integration (no CLI deploys — see note below).

- `src/lib/notion.ts` — `getListings()` (active listings, `Archived = false`,
  sorted by Fit Score descending), `getArchivedListings()` (`Archived =
  true`, sorted by creation time descending), and `setListingArchived()`
  (writes the `Archived` checkbox — used by both the manual archive button
  and the restore button).
- `src/app/page.tsx` — server component, fetches active listings via
  `getListings()`, `revalidate = 300`.
- `src/app/archive/page.tsx` — server component, fetches archived listings
  via `getArchivedListings()`, renders `ArchiveApp`.
- `src/app/api/listings/[id]/archive/route.ts` — `POST`, body
  `{ archived: boolean }` (defaults to `true` if omitted), calls
  `setListingArchived()`. Used by both the main app's Archive button and the
  Archive tab's Restore button.
- `src/components/JobFitApp.tsx` — client component implementing the main
  UI. Responsive breakpoints tracked via a `window.innerWidth` resize
  listener (`isDesktop` at ≥860px, `isTabletUp` at ≥640px):
  - **Desktop (≥860px):** persistent left sidebar with three independent
    filter groups — Fit Score (the five tier badges: Great/Good/Possible/
    Weak/Poor, matching `scoreTier()`), Work Mode (Remote/Hybrid/Onsite,
    matches `workMode` exactly), and Location (Montreal/Ottawa/Toronto,
    matches on the raw location text) — each with checkboxes + counts and a
    combined "Clear all". The three groups AND together; options within a
    group OR. A
    **master-detail split view** — list and detail pane side by side,
    detail pane is `position: sticky`; clicking a card never navigates away
    from the list, it just populates the detail pane (a `×` button clears
    the selection without leaving the list). Sort-by dropdown (Fit score /
    Most recent / Company A–Z) above the list — though visa-sponsorship
    listings always sort first regardless of this setting (see below).
  - **Mobile/tablet (<860px):** a button opens a bottom-sheet with the same
    three filter groups (no counts shown); selecting a card replaces the
    list with a full-screen detail overlay with a back button, rather than
    showing both at once.
  - **Archive button** on the detail pane calls the archive API route,
    optimistically removes the listing from the current session's list
    (client-side `archivedIds` set layered over the server-fetched `jobs`
    prop — no refetch needed), and returns to the list view.
  - **Archive tab** (`/archive`, `ArchiveApp` component) is a deliberately
    simple, unfiltered, unsorted list of archived listings (reusing the
    shared badge/theme/icon pieces exported from `JobFitApp.tsx`), each with
    a Restore button. There's a header link between the main page and
    `/archive` in both directions.
  - **Preventing unbounded list growth:** two mechanisms feed the `Archived`
    checkbox — the scheduled routine's age-based archive (>13 days) and
    fast-archive (score <2.0 and >2 days old, since a confidently poor-fit
    role doesn't need the full 13-day grace period), plus the manual Archive
    button for one-off dismissals. All three are soft/reversible; nothing is
    ever hard-deleted from Notion by this pipeline.
  - **Visa Sponsorship** gets a deliberately distinct gold badge (not the
    app's red accent) on both the card and detail view, plus a gold card
    border — rare and high-value, so it's designed to be impossible to miss
    at a glance. Listings with it set sort near the top, ahead of the
    active sort criterion (implemented as a comparator in the sort
    function, before whatever `sortBy` is selected).
  - **Unity Priority** gets its own distinct blue badge/border (`UNITY_BLUE`,
    separate from both the red accent and the gold visa badge, since a card
    can carry both at once) and is the single highest sort priority —
    ahead of even Visa Sponsorship — reflecting that it's the most
    consequential flag in the whole app for Daniel specifically (see the
    Job Listings schema note above on why). A card shows both badges
    stacked if a listing happens to have both flags set.
  - Visual design ported from a Claude Design canvas ("Job Fit Tracker
    Mobile.dc.html," Modernist design system — Archivo type, sharp corners,
    red accent `#ec3013`, thick dividers), re-imported and re-implemented
    once to add sort-by and the desktop split view (the original import was
    mobile-only). Light theme only — the original design's dark mode toggle
    was removed as unnecessary complexity for a single-user personal tool.
  - **Search box** above the list on both the main page and `/archive`,
    client-side substring match against title/company/location. On the main
    page it combines (ANDs) with the three filter groups; on `/archive` it's
    the only refinement, consistent with the Archive tab's simple-list
    design.
  - Archive/Restore both check the fetch response status before applying
    their optimistic UI update — a failed write shows an inline "Couldn't
    archive/restore — try again" message next to the button rather than
    silently pretending the Notion write succeeded.
  - Two layout bugs existed in the source design and were fixed during
    implementation, not present in the design file itself: the row
    containing the mobile filter button needs `flexWrap: wrap` (without it,
    a `width: 100%` sibling in a non-wrapping flex row pushes the list
    completely off-screen on mobile), and the detail pane's mobile overlay
    needs `top: 0` to match its `inset: 0` full-screen positioning (the
    design's `top: "auto"` combined with `inset: 0` left a large blank gap
    above the content).

## Deployment notes

- **Vercel deploys only via the GitHub integration** (push to `main`) —
  CLI-triggered deploys (`vercel deploy`) were found to be rejected by
  Vercel's GitHub-authorship check on this account. Env vars can still be
  managed via the Vercel dashboard or `vercel env`, but deployment itself
  should always go through a git push.
- Required Vercel env vars: `NOTION_API_KEY`, `NOTION_DATA_SOURCE_ID`,
  `NOTION_INBOX_DATA_SOURCE_ID`, `RSS_APP_WEBHOOK_SECRET`, `CRON_SECRET` —
  see `.env.example`.
- The webhook URL to enter in rss.app for every feed:
  `https://job-fit-tracker.vercel.app/api/webhooks/rss`.
- `vercel.json` defines the ASGC poller's cron schedule — Vercel Cron Jobs
  are registered from that file on every deploy, no separate dashboard
  setup needed beyond setting `CRON_SECRET`.

## Known simplifications / things worth revisiting

- Feed count is capped at 15 (rss.app Basic plan), not 2 — a single webhook
  endpoint can have many feeds attached to it. Room to add several more
  targeted LinkedIn searches (see the natural-language query approach in
  the "why webhook" note below) before hitting any real limit.
- The scoring routine authenticates to Notion via the attached MCP
  connector, tied to whichever Notion account is connected to the Claude
  account that owns the routine — not the same integration token the
  webapp uses. If that connection ever needs rotating, it's managed at
  https://claude.ai/customize/connectors, not via an env var.
- The webapp can write back to Notion only for the `Archived` checkbox (via
  the archive API route); `Status` is still only editable directly in
  Notion.
