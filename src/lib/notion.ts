import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";

const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID ?? "";

export type WorkMode = "Remote" | "Hybrid" | "Onsite" | "Unknown";

export interface DisplayListing {
  id: string;
  title: string;
  company: string;
  companyLink: string;
  location: string;
  workMode: WorkMode;
  pay: string;
  link: string;
  datePosted: string | null;
  fitScore: number | null;
  fitReasoning: string;
  status: string;
  visaSponsorship: boolean;
}

function richText(prop: unknown): string {
  const rt = (prop as { rich_text?: { plain_text: string }[] })?.rich_text;
  return rt?.map((t) => t.plain_text).join("") ?? "";
}

function pageToListing(page: PageObjectResponse): DisplayListing {
  const props = page.properties as Record<string, unknown>;
  const titleProp = props.Title as { title?: { plain_text: string }[] };
  return {
    id: page.id,
    title: titleProp?.title?.map((t) => t.plain_text).join("") ?? "Untitled",
    company: richText(props.Company),
    companyLink: (props["Company Link"] as { url?: string })?.url ?? "",
    location: richText(props.Location),
    workMode: ((props["Work Mode"] as { select?: { name?: string } })?.select?.name as WorkMode) ?? "Unknown",
    pay: richText(props.Pay),
    link: (props.Link as { url?: string })?.url ?? "",
    datePosted: (props["Date Posted"] as { date?: { start?: string } })?.date?.start ?? null,
    fitScore: (props["Fit Score"] as { number?: number })?.number ?? null,
    fitReasoning: richText(props["Fit Reasoning"]),
    status: (props.Status as { select?: { name?: string } })?.select?.name ?? "New",
    visaSponsorship: (props["Visa Sponsorship"] as { checkbox?: boolean })?.checkbox ?? false,
  };
}

function getClient(): Client {
  const auth = process.env.NOTION_API_KEY;
  if (!auth) throw new Error("NOTION_API_KEY is not set");
  return new Client({ auth });
}

/** Fetches active (non-archived) listings, sorted by fit score (highest first). */
export async function getListings(): Promise<DisplayListing[]> {
  const client = getClient();
  const response = await client.dataSources.query({
    data_source_id: DATA_SOURCE_ID,
    filter: { property: "Archived", checkbox: { equals: false } },
    sorts: [{ property: "Fit Score", direction: "descending" }],
  });
  return response.results.filter((r): r is PageObjectResponse => "properties" in r).map(pageToListing);
}

/** Fetches archived listings only, most recently added first. */
export async function getArchivedListings(): Promise<DisplayListing[]> {
  const client = getClient();
  const response = await client.dataSources.query({
    data_source_id: DATA_SOURCE_ID,
    filter: { property: "Archived", checkbox: { equals: true } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  return response.results.filter((r): r is PageObjectResponse => "properties" in r).map(pageToListing);
}

/** Archives or restores a listing (soft, reversible — a plain checkbox, not Notion's native trash). */
export async function setListingArchived(pageId: string, archived: boolean): Promise<void> {
  const client = getClient();
  await client.pages.update({
    page_id: pageId,
    properties: { Archived: { checkbox: archived } } as never,
  });
}
