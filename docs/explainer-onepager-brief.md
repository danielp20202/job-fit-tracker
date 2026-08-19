# One-Pager Design Brief: "What is this tool?"

For a design agent creating a simple, visual explainer (1-2 pages) of this
project. This is NOT a technical document and the output should not read
like one — no architecture diagrams, no mention of the tools/services used
to build it. The audience has never heard of Notion, webhooks, RSS feeds,
or cron jobs, and doesn't need to.

## Audience

People actively job hunting on LinkedIn. Assume they're comfortable with
LinkedIn's job search and filters, but nothing more technical than that.
They're likely tired, a little frustrated, and checking LinkedIn multiple
times a day out of anxiety that they'll miss something good. Write and
design for that person — not for a recruiter, not for a developer.

## The problem (this is the hook — lead with it)

Job searching on LinkedIn today means manually refreshing a search result
page over and over, scrolling past dozens of postings that are obviously
wrong (wrong seniority, wrong location, wrong everything) to find the one
or two that might actually be worth applying to. It's repetitive, it's
easy to miss something good in the noise, and it happens all day, every
day, for weeks or months.

## What this tool does (plain-language version)

1. **You describe what a genuinely good-fit job looks like for you** — not
   just a job title, but the real criteria: seniority level, remote/hybrid/
   location, salary range, deal-breakers, what you're actually looking for
   in a next role.
2. **It watches for new postings continuously**, all day, so you don't have
   to keep refreshing the page yourself.
3. **Every new posting gets automatically scored against your criteria** —
   like having someone read each one and rate how well it actually matches
   what you said you want, not just whether it contains the right keywords.
4. **You see one clean, ranked list** — best matches first — instead of a
   raw, unsorted feed you have to sift through yourself.

The core idea in one sentence: **instead of you searching LinkedIn, the
search runs continuously in the background and hands you a ranked
shortlist.**

## What makes this different from just using LinkedIn's own filters

LinkedIn's filters narrow results down by hard criteria (location, date
posted, etc.), but they can't judge *fit* the way a person would — a
posting titled "Account Manager" could be a great match or completely
wrong depending on seniority, industry, and a dozen details a keyword
filter can't see. This tool's scoring step is meant to replace that
manual judgment call — the part where you actually read the posting and
decide "is this worth my time?" — and do it automatically, continuously,
for every new posting, not just the ones you happen to be scrolling past
when you check.

## Tone

Friendly, plain-spoken, a little empathetic to how tedious job searching
is. Not corporate, not salesy, not technical. Think "a smart friend
explained this to me in two minutes," not "product marketing landing
page."

## Suggested structure (adjust as you see fit — this is a starting point,
not a spec)

- A short, punchy headline naming the problem (e.g. something like "Stop
  refreshing LinkedIn all day" — write your own, this is just the idea)
- One simple visual showing the shift: **before** (scrolling an endless,
  unsorted list, most of it irrelevant) **vs. after** (a short, ranked list
  of just the good matches). This is the single most important visual —
  it should communicate the value in one glance without needing to read
  any text.
- A simple 3-4 step flow diagram of how it works, in the plain-language
  terms above (describe your criteria → it watches continuously → each
  posting gets scored → you see a ranked shortlist). Keep each step to a
  short phrase, not a paragraph.
- Optionally, a small mocked-up example: a couple of sample job cards
  showing what a "ranked result" might look like (job title, company, a
  fit score or match indicator, one line explaining why it's a good
  match) — enough to make the concept concrete without it needing to be a
  literal product screenshot.

## Constraints

- 1-2 pages, meant to be read in under a minute.
- No implementation detail of any kind — nothing about what the tool is
  built with, what data sources it uses, or how the scoring technically
  works. Stay entirely at the "what does this do for me" level.
- No specific company names, real job postings, or real people's data in
  any example content — use clearly generic/placeholder examples.

---

## Technical reference (context for you only — do not put any of this in
the actual output; it exists so your diagrams and step descriptions are
grounded in what the tool actually does, translated into the plain-language
terms above)

This is a real, currently-running pipeline, not a concept. Here's what
actually happens, end to end:

1. **Watching LinkedIn**: two saved LinkedIn job searches (specific title/
   seniority criteria, e.g. "Manager, Senior Manager, Director, Head, or VP
   of Customer Success roles, remote or hybrid in Canada") are each turned
   into an RSS feed via a third-party service (rss.app), which polls
   LinkedIn's search results and detects new postings automatically.
2. **Real-time capture**: the moment a new posting is detected, that
   service pushes it (via a webhook — an automatic instant notification,
   not a scheduled check) to a small receiving endpoint that's part of this
   project's webapp. That endpoint verifies the push is legitimate, then
   stores the raw posting (title, link, description, date) in a holding
   area — nothing is scored yet at this point, it's just captured.
3. **Scoring, on a schedule**: three times a day, a separate automated
   process wakes up, reads everything sitting unscored in that holding
   area, and for each one:
   - Skips it if it's a duplicate of something already scored recently.
   - Reads the posting (fetching the full page for anything that looks
     plausibly relevant by title, to get accurate details like whether
     it's remote/hybrid/onsite and what it pays).
   - Scores it 1-5 against a personal rubric — a written set of criteria
     covering seniority, industry fit, location/remote requirements,
     salary floor, and account/leadership scope, with automatic
     disqualifiers for things like on-site-only roles outside the user's
     city or pay below a stated floor.
   - Saves the scored result (with a one-sentence explanation of the score)
     to the main results list.
   - Also handles simple housekeeping: postings older than a week get
     flagged as stale, postings older than ~2 weeks get archived out of the
     active list.
4. **Viewing results**: a webapp reads that results list and displays it as
   a ranked, filterable list — sorted best-fit-first, with a filter for
   location (remote / specific cities). Clicking a listing shows a detail
   view with the full score breakdown and a link to the original posting.

Plain-language mapping for the doc: step 1-2 above = "it watches
continuously." Step 3 = "every new posting gets automatically scored"
(the "someone reads each one and rates it" framing is describing this
step — the actual scoring is done by an AI model applying the rubric, but
the doc should describe the *outcome* — a human-judgment-quality read of
fit — not the mechanism). Step 4 = "you see one clean, ranked list."

If your diagram wants a 4-step flow instead of the 3-4 step version
suggested above, these four real stages (capture → hold → score → display)
map cleanly to it — just keep every label in plain language, e.g. "Watches
LinkedIn" → "Catches new postings instantly" → "Scores each one against
your criteria" → "Shows you a ranked list."
