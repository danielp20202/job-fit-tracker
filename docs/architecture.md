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

`POST /api/webhooks/rss`. Verifies the `RSSApp-Signature` header
(HMAC-SHA256 over the raw body, using `RSS_APP_WEBHOOK_SECRET`), parses
`data.items_new[]` from the payload, and writes each item into the Notion
"Job Inbox" database as an unprocessed row. No scoring happens here — this
endpoint is intentionally cheap and does nothing but capture.

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
entire task (Notion API details, both schemas, the full fit rubric, and
every step) is self-contained in the routine's prompt, calling the Notion
REST API directly via `curl` (no MCP connector, no git checkout).

Each run:

1. Queries Job Inbox for unprocessed rows.
2. Queries Job Listings for existing `Link` values, bounded to pages added
   in the last 14 days (a fixed-cost dedup lookup regardless of how large
   Job Listings grows over time — real duplicates would only ever appear
   within a day or two given the feeds' 3-hour freshness window; the 14-day
   window is a safety margin for pipeline gaps, not an expected reprocessing
   case).
3. Skips anything already in that set (marks it Processed, doesn't rescore).
4. Parses title/company/location from the raw feed text.
5. For titles containing Customer Success / Client Success / Account
   Management / Strategic Accounts / Partner Relations / Renewal Manager /
   Merchant Success / CSM (any seniority — this was deliberately widened
   from an earlier "leadership titles only" draft, since IC-level Senior CSM
   roles are explicitly in-rubric and pay data materially changes their
   score), fetches the full posting via WebFetch to get accurate Work Mode,
   Pay, and Company Link. Everything else is scored off the title +
   description snippet alone, to avoid paying for a full fetch on obvious
   noise.
6. Scores every non-duplicate item 1-5 against the rubric (embedded
   verbatim from `docs/fit-rubric.md` — keep both in sync if the rubric
   changes).
7. Publishes results to Job Listings.
8. Marks every processed Inbox row.
9. Tags listings `Stale` if `Date Posted` is >7 days old.
10. Archives (Notion soft-delete, recoverable) listings >13 days old.

### 5. Notion — "Job Listings" database

The scored, canonical dataset the webapp reads. Schema: Title, Company,
Company Link, Location, Work Mode (select), Pay, Link, Date Posted, Date
Added (created_time), Fit Score (1-5), Fit Reasoning, Status (select —
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
  UI: list screen, detail screen, and a bottom-sheet location filter
  (Remote / Montreal / Ottawa / Toronto, multi-select). Visual design ported
  from a Claude Design canvas ("Job Fit Tracker Mobile.dc.html," Modernist
  design system — Archivo type, sharp corners, red accent `#ec3013`, thick
  dividers). Manual light/dark toggle (not tied to system preference,
  matching the original design spec).

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
- The scoring routine's Notion access is a raw bearer token embedded in its
  prompt (no MCP connector attached to that cloud sandbox) — rotate the
  Notion integration token if it's ever compromised, and update the routine
  via `RemoteTrigger` `update`.
- No write-back from the webapp to Notion yet (Status is only editable
  directly in Notion).
