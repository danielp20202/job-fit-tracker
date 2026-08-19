import { getListings, type DisplayListing } from "@/lib/notion";
import { ListingsBoard } from "@/components/ListingsBoard";

export const revalidate = 300; // re-fetch from Notion at most every 5 minutes

export default async function Home() {
  let listings: DisplayListing[] = [];
  let error: string | null = null;

  try {
    listings = await getListings();
  } catch {
    error = "Notion isn't configured yet — set NOTION_API_KEY and NOTION_DATA_SOURCE_ID in .env.local.";
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Job Listings</h1>

        {error && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {error}
          </p>
        )}

        {!error && listings.length === 0 && (
          <p className="text-zinc-500">No listings yet — they&apos;ll show up here once the scheduled job runs.</p>
        )}

        {!error && listings.length > 0 && <ListingsBoard listings={listings} />}
      </main>
    </div>
  );
}
