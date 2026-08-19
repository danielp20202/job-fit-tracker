import { getListings, type DisplayListing } from "@/lib/notion";

export const revalidate = 300; // re-fetch from Notion at most every 5 minutes

function FitBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-zinc-400 text-sm">—</span>;
  const color =
    score >= 4 ? "bg-green-100 text-green-800" : score >= 3 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${color}`}>{score}/5</span>;
}

function ListingCard({ listing }: { listing: DisplayListing }) {
  return (
    <a
      href={listing.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-black dark:text-zinc-50">{listing.title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {listing.company} · {listing.location}
          </p>
        </div>
        <FitBadge score={listing.fitScore} />
      </div>
      {listing.fitReasoning && (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">{listing.fitReasoning}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span>{listing.status}</span>
        {listing.datePosted && <span>· posted {new Date(listing.datePosted).toLocaleDateString()}</span>}
      </div>
    </a>
  );
}

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
          <p className="text-zinc-500">No listings yet. Run the pipeline to fetch and score jobs.</p>
        )}

        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </main>
    </div>
  );
}
