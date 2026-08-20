import type { InboxItem } from "@/lib/notion";

const ASGC_API_URL = "https://jobs.asgc.gg/api/job-listings";
const ASGC_CATEGORY = "Customer & Community Support";

export const ASGC_FEED_TITLE = "ASGC — Customer & Community Support (Canada)";

interface AsgcRow {
  companyName: string;
  companyCategory: string;
  title: string;
  overallCategory: string;
  locationType: string;
  city: string;
  state: string;
  country: string;
  jobType: string;
  activatedDate: string;
  jobLink: string;
  experienceDisplay: string;
}

/**
 * ASGC's site is a client-rendered SPA — both the page and its `/api/job-listings`
 * endpoint ignore every filter query param and always return the full ~68K-row
 * dataset (~39MB); filtering only ever happens in the browser after the fact.
 * There's no server-side filtered URL to point an RSS scraper at, so this fetches
 * the whole dump and filters here instead.
 */
async function fetchAsgcRows(): Promise<AsgcRow[]> {
  const res = await fetch(ASGC_API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`ASGC fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const rows = (data.rows ?? data) as AsgcRow[];
  if (!Array.isArray(rows)) throw new Error("ASGC response shape changed — expected an array of rows");
  return rows;
}

function parseAsgcDate(raw: string): string | null {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toInboxItem(row: AsgcRow): InboxItem {
  const location = [row.city, row.state].filter(Boolean).join(", ") + (row.city || row.state ? ", Canada" : "Canada");
  const description = [
    `Company: ${row.companyName} (${row.companyCategory})`,
    `Location: ${location} — ${row.locationType}`,
    `Job Type: ${row.jobType}`,
    row.experienceDisplay ? `Experience: ${row.experienceDisplay}` : null,
    "No further description text is available from this source — score conservatively where scope/comp can't be assessed, per the rubric's low-confidence guidance.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: row.title,
    url: row.jobLink,
    description,
    feedTitle: ASGC_FEED_TITLE,
    datePublished: parseAsgcDate(row.activatedDate),
  };
}

/** Customer & Community Support roles located in Canada, from ASGC's game-industry job board. */
export async function fetchAsgcCanadaSupportJobs(): Promise<InboxItem[]> {
  const rows = await fetchAsgcRows();
  return rows.filter((r) => r.overallCategory === ASGC_CATEGORY && r.country === "Canada").map(toInboxItem);
}
