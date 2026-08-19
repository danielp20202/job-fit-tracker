# job-fit-tracker — Webapp Design Brief

For a design/UI agent asked to improve the visual design of this webapp and
hand back instructions or changes. This doc gives context only — it does not
prescribe a visual direction. Read it, then propose/implement your own take.

## What this project is

A personal job-search tool for one user (Daniel), a Customer Success
professional in Montreal, Canada. A scheduled background job periodically
pulls Customer Success job postings from LinkedIn (via RSS or scraping),
scores each one for "fit" against Daniel's personal rubric using an LLM, and
writes the results into a Notion database. This Next.js webapp is the
read-only front end for that Notion database — it's Daniel's personal
dashboard for browsing scored job listings and deciding what to apply to.

There is no multi-user auth, no write-back to Notion from the webapp (yet),
and no account system. It's a single-purpose personal tool, deployed to
Vercel, intended to be checked by Daniel a few times a week.

## Tech stack (constraints for implementation)

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- Data source: Notion API, read via `src/lib/notion.ts` (`getListings()`)
- Currently a single page: `src/app/page.tsx`, a server component that
  fetches listings server-side and renders them
- No client-side data fetching library (no SWR/React Query) — keep it simple
- Supports light and dark mode via Tailwind's `dark:` variants (see existing
  `dark:bg-black` etc. usage) — any redesign must work in both

## Current pages

1. **`/` (Job Listings)** — the only page today. Shows every listing from
   Notion as a vertical list of cards, sorted by fit score (highest first).
   Each card currently shows: title, company, location, a fit score badge
   (color-coded green/yellow/red for 4-5/3/1-2), a one-sentence fit
   reasoning, status (New/Reviewed/Applied/Rejected/Ignored), and posted
   date. The whole card is a link to the original LinkedIn posting.

That's it — one page, no navigation, no detail view. A job detail page
doesn't exist yet (not requested).

## Data model (Notion database "Job Listings")

Each listing has (or soon will have) these fields:

- **Title** — job title (text)
- **Company** — company name (text)
- **Company Link** *(new)* — URL to the company's website or LinkedIn page
- **Location** — city/region as posted, e.g. "Toronto, Ontario, Canada" (text)
- **Work Mode** *(new)* — Remote / Hybrid / Onsite / Unknown (select) — not
  always determinable from the posting
- **Pay** *(new)* — salary/compensation as stated in the posting, free text
  since formats vary wildly (e.g. "$120K-150K CAD", "$95K base + bonus", or
  empty if not listed)
- **Link** — URL to the original job posting
- **Fit Score** — 1-5 integer, LLM-scored against Daniel's rubric
- **Fit Reasoning** — one-sentence explanation of the score
- **Date Posted** — when the job was posted (date, sometimes missing)
- **Status** — New / Reviewed / Applied / Rejected / Ignored (select,
  currently manually edited in Notion, not editable from the webapp)

## Requested functional changes (already planned, not yet built — factor
these into any visual redesign)

1. **Extract and display Work Mode, Pay, and Company Link** wherever
   available (many listings won't have all of these — design should handle
   missing data gracefully, not show empty labels).
2. **Location should be visually prominent** — Daniel specifically wants it
   to read as a tag/chip, not buried in a subtitle line like it is today.
3. **Location filtering** — Daniel only wants to see jobs that are Remote,
   or based in Montreal, Ottawa, or Toronto. Needs a filter control (exact
   UI pattern is open — tabs, chip toggle group, dropdown, whatever reads
   best) that lets him narrow the list to one or more of: Remote, Montreal,
   Ottawa, Toronto (and probably "All" to reset). This will need to be a
   client component since it's interactive; the page can still fetch data
   server-side and pass it down.

## What "fit" scoring looks like (for context on card content)

Fit Score is 1-5, always paired with a one-sentence reasoning string, e.g.
"Manager-level title at a data-collaboration SaaS company in Toronto; team
size and remote/hybrid status not confirmed from listing alone." This
reasoning text is important — it's the main way Daniel decides whether to
click through, so it needs a legible, prominent-but-not-overwhelming
treatment on the card.

## Design goals / freedom

- The current UI is functional but generic (default Tailwind starter
  aesthetic, no real visual identity). There's room to make it feel more
  like a considered personal tool.
- Information density matters: Daniel will scan many cards at once looking
  for high-fit remote/Montreal/Ottawa/Toronto roles, so whatever design is
  proposed should optimize for fast scanning (score, location, work mode
  should be gettable at a glance) without hiding the reasoning text that
  justifies the score.
- No branding constraints — this is a personal tool, not a product with an
  existing brand. Free to propose a color palette, typography choices, card
  layout, filter UI pattern, etc.
- Must work well with an empty state (no listings yet) and a partial-data
  state (some fields like Pay or Work Mode missing on many cards) — these
  aren't edge cases, they're the common case, since not every LinkedIn
  posting states pay or work mode explicitly.

## Deliverable expected back

Concrete implementation-ready guidance: either a description of layout/
component changes precise enough for another agent to implement directly
(e.g. "card becomes a 2-column grid on desktop, location tag uses a pill
with a location-pin icon, filter bar is a horizontal chip toggle group above
the list, sticky on scroll"), or the actual code changes to
`src/app/page.tsx` (and new components under `src/app/` or `src/components/`
if it makes sense to split the card/filter bar out) if you're able to
implement directly. Keep using Tailwind CSS v4 utility classes consistent
with the rest of the app rather than introducing a new styling approach.
