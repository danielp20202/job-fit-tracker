# Architecture

job-fit-tracker is a personal job-search pipeline for Daniel Pinzon. It pulls
Customer Success / Account Management job postings from LinkedIn, scores each
one against Daniel's fit rubric, and displays the results in a mobile-first
webapp. Everything runs unattended except reviewing the results.

## Pipeline overview

```
LinkedIn searches (multiple, via rss.app)
        │  rss.app polls each search URL, diffs against what it last saw
        ▼
rss.app webhooks (fire on new items only, real-time)
        │  POST with items_new[]
        ▼
POST /api/webhooks/rss  (this repo, deployed on Vercel)
        │  verifies HMAC-SHA256 signature, writes raw rows
        ▼
Notion — "Job Inbox" database        (unprocessed, unscored)
        │
        │  scheduled cloud routine, 3x/day
        ▼
Notion — "Job Listings" database     (scored, deduped, lifecycle-managed)
        │
        │  getListings() — server component, revalidate every 5 min
        ▼
Webapp at job-fit-tracker.vercel.app  (list / detail / location filter)
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

### 3. Notion — "Job Inbox" database

Staging area. Schema: Title, URL, Description, Date Published, Feed Title,
Processed (checkbox), Received At. Data source id:
`0c47226a-b5f5-45e2-9864-e8f882893535`.

### 4. Scheduled cloud routine — `job-fit-tracker-scorer`

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
9. Archives (Notion soft-delete, recoverable) listings >13 days old.

### 5. Notion — "Job Listings" database

The scored, canonical dataset the webapp reads. Schema: Title, Company,
Company Link, Location, Work Mode (select), Pay, Link, Date Posted, Date
Added (created_time), Fit Score (1.0-5.0, decimals allowed), Fit Reasoning, Status (select —
manually edited by Daniel in Notion; New/Reviewed/Applied/Rejected/Ignored),
Source Guid, Stale (checkbox). Data source id:
`fa5209fd-9b4e-49fe-bfbe-f6f3fbc0c69f`. Both databases live under the
[Job Search](https://app.notion.com/p/3c1800d538a7814da15ec4ae519b0f00)
page.

### 6. Webapp — this repo

Next.js 16 (App Router) + TypeScript + Tailwind v4, deployed on Vercel at
https://job-fit-tracker.vercel.app, auto-deploying from `main` via the
GitHub integration (no CLI deploys — see note below).

- `src/lib/notion.ts` — `getListings()`, server-side read via
  `@notionhq/client`, sorted by Fit Score descending.
- `src/app/page.tsx` — server component, fetches listings, `revalidate = 300`.
- `src/components/JobFitApp.tsx` — client component implementing the actual
  UI. Responsive breakpoints tracked via a `window.innerWidth` resize
  listener (`isDesktop` at ≥860px, `isTabletUp` at ≥640px):
  - **Desktop (≥860px):** persistent left sidebar with location filters
    (checkboxes + per-location counts, "Clear all"), and a **master-detail
    split view** — list and detail pane side by side, detail pane is
    `position: sticky`; clicking a card never navigates away from the list,
    it just populates the detail pane (a `×` button clears the selection
    without leaving the list). Sort-by dropdown (Fit score / Most recent /
    Company A–Z) above the list.
  - **Mobile/tablet (<860px):** a button opens a bottom-sheet location
    filter (same options, no counts shown); selecting a card replaces the
    list with a full-screen detail overlay with a back button, rather than
    showing both at once.
  - Visual design ported from a Claude Design canvas ("Job Fit Tracker
    Mobile.dc.html," Modernist design system — Archivo type, sharp corners,
    red accent `#ec3013`, thick dividers), re-imported and re-implemented
    once to add sort-by and the desktop split view (the original import was
    mobile-only). Manual light/dark toggle (not tied to system preference,
    matching the original design spec).
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
  `NOTION_INBOX_DATA_SOURCE_ID`, `RSS_APP_WEBHOOK_SECRET` — see
  `.env.example`.
- The webhook URL to enter in rss.app for every feed:
  `https://job-fit-tracker.vercel.app/api/webhooks/rss`.

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
- No write-back from the webapp to Notion yet (Status is only editable
  directly in Notion).
