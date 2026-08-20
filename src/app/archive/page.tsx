import { getArchivedListings, type DisplayListing } from "@/lib/notion";
import { ArchiveApp } from "@/components/ArchiveApp";

export const revalidate = 300;

export default async function ArchivePage() {
  let listings: DisplayListing[] = [];
  let error: string | null = null;

  try {
    listings = await getArchivedListings();
  } catch {
    error = "Notion isn't configured yet — set NOTION_API_KEY and NOTION_DATA_SOURCE_ID in .env.local.";
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f2f2", color: "#201e1d", padding: 24 }}>
        <div className="max-w-[440px] sm:max-w-[600px] lg:max-w-[680px] mx-auto">
          <h1 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 12px" }}>Archive</h1>
          <p style={{ border: "1.5px solid #dd2b0f", background: "#fff2ef", color: "#ae1800", padding: 14, fontSize: 13 }}>{error}</p>
        </div>
      </div>
    );
  }

  return <ArchiveApp jobs={listings} />;
}
