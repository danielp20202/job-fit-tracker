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
