import { getListings, type DisplayListing } from "@/lib/notion";
import { JobFitApp } from "@/components/JobFitApp";

export const revalidate = 300; // re-fetch from Notion at most every 5 minutes

export default async function Home() {
  let listings: DisplayListing[] = [];
  let error: string | null = null;

  try {
    listings = await getListings();
  } catch {
    error = "Notion isn't configured yet — set NOTION_API_KEY and NOTION_DATA_SOURCE_ID in .env.local.";
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f2f2", color: "#201e1d", padding: 24 }}>
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 12px" }}>Job Fit Tracker</h1>
          <p style={{ border: "1.5px solid #dd2b0f", background: "#fff2ef", color: "#ae1800", padding: 14, fontSize: 13 }}>{error}</p>
        </div>
      </div>
    );
  }

  return <JobFitApp jobs={listings} />;
}
