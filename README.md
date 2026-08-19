# job-fit-tracker

A personal job-search pipeline: LinkedIn Customer Success / Account
Management postings get pulled in near-real-time, scored against a personal
fit rubric, and shown in a mobile-first webapp sorted by fit.

**Live app:** https://job-fit-tracker.vercel.app

See [docs/architecture.md](docs/architecture.md) for the full pipeline —
how postings get captured (rss.app webhooks), scored (a scheduled cloud
agent, not code in this repo), and displayed. See
[docs/fit-rubric.md](docs/fit-rubric.md) for the actual scoring criteria.

## What's in this repo

Just the webapp and its webhook receiver — the scoring itself runs as a
separate scheduled cloud routine (see architecture doc), not as code here.

- `src/app/page.tsx` + `src/components/JobFitApp.tsx` — reads scored
  listings from Notion and renders them (list view, detail view, location
  filter, light/dark mode).
- `src/app/api/webhooks/rss/route.ts` — receives rss.app webhook pushes and
  stages raw items into a Notion "Job Inbox" database.
- `src/lib/notion.ts` — Notion read client used by the webapp.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values, see below
npm run dev
```

Open http://localhost:3000 to see it (or whatever port you pass via
`-p`/`.claude/launch.json` if you've configured one).

### Environment variables

See `.env.example` for the full list with descriptions. You'll need:

- A Notion integration token, with the "Job Search" page shared with it
  (create at notion.so/my-integrations)
- The Job Listings and Job Inbox data source IDs (already filled in
  `.env.example` — they point at the live databases)
- The rss.app webhook signing secret, if testing the webhook route locally

## Deployment

Deploys automatically from `main` via Vercel's GitHub integration — just
push. **Don't deploy via the Vercel CLI**; it gets rejected by Vercel's
GitHub-authorship check on this account (see architecture doc for why).
Env vars are managed in the Vercel dashboard.
