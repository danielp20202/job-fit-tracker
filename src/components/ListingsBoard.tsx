"use client";

import { useMemo, useState } from "react";
import type { DisplayListing } from "@/lib/notion";

const LOCATION_FILTERS = ["Remote", "Montreal", "Ottawa", "Toronto"] as const;
type LocationFilter = (typeof LOCATION_FILTERS)[number];

function matchesFilter(listing: DisplayListing, filter: LocationFilter): boolean {
  if (filter === "Remote") return listing.workMode === "Remote";
  return listing.location.toLowerCase().includes(filter.toLowerCase());
}

function FitBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-zinc-400 text-sm">—</span>;
  const color =
    score >= 4 ? "bg-green-100 text-green-800" : score >= 3 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${color}`}>{score}/5</span>;
}

function WorkModeTag({ mode }: { mode: DisplayListing["workMode"] }) {
  if (mode === "Unknown") return null;
  const color =
    mode === "Remote"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : mode === "Hybrid"
        ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
        : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{mode}</span>;
}

function LocationTag({ location }: { location: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {location || "Unknown location"}
    </span>
  );
}

function ListingCard({ listing }: { listing: DisplayListing }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <a href={listing.link || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">
            <h2 className="font-semibold text-black dark:text-zinc-50">{listing.title}</h2>
          </a>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {listing.companyLink ? (
              <a href={listing.companyLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {listing.company}
              </a>
            ) : (
              listing.company
            )}
          </p>
        </div>
        <FitBadge score={listing.fitScore} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <LocationTag location={listing.location} />
        <WorkModeTag mode={listing.workMode} />
        {listing.pay && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {listing.pay}
          </span>
        )}
      </div>

      {listing.fitReasoning && <p className="text-sm text-zinc-500 dark:text-zinc-500">{listing.fitReasoning}</p>}

      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span>{listing.status}</span>
        {listing.datePosted && <span>· posted {new Date(listing.datePosted).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}

export function ListingsBoard({ listings }: { listings: DisplayListing[] }) {
  const [activeFilters, setActiveFilters] = useState<Set<LocationFilter>>(new Set());

  const toggleFilter = (filter: LocationFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return listings;
    return listings.filter((listing) => [...activeFilters].some((filter) => matchesFilter(listing, filter)));
  }, [listings, activeFilters]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {LOCATION_FILTERS.map((filter) => {
          const active = activeFilters.has(filter);
          return (
            <button
              key={filter}
              type="button"
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                active
                  ? "border-black bg-black text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
              }`}
            >
              {filter}
            </button>
          );
        })}
        {activeFilters.size > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilters(new Set())}
            className="text-sm text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No listings match the selected filters.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
