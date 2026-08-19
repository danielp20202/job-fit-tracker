"use client";

import { useMemo, useState } from "react";
import type { DisplayListing } from "@/lib/notion";

const ACCENT = "#ec3013";
const LOCATION_FILTERS = ["Remote", "Montreal", "Ottawa", "Toronto"] as const;
type LocationFilter = (typeof LOCATION_FILTERS)[number];

const FIT_LABELS: Record<number, string> = {
  5: "Great fit",
  4: "Good fit",
  3: "Possible fit",
  2: "Weak fit",
  1: "Poor fit",
};

const BADGE_LIGHT: Record<number, { bg: string; color: string }> = {
  5: { bg: "#dd2b0f", color: "#ffffff" },
  4: { bg: "#ffc4b8", color: "#7c1405" },
  3: { bg: "#d7d3d3", color: "#444141" },
  2: { bg: "#eae7e7", color: "#605d5d" },
  1: { bg: "#f8f4f4", color: "#7d7979" },
};
const BADGE_DARK: Record<number, { bg: string; color: string }> = {
  5: { bg: "#ff9783", color: "#201e1d" },
  4: { bg: "#7c1405", color: "#ffc4b8" },
  3: { bg: "#444141", color: "#d7d3d3" },
  2: { bg: "#2d2b2b", color: "#9b9797" },
  1: { bg: "#201e1d", color: "#605d5d" },
};
const BADGE_NEUTRAL = { light: { bg: "#eae7e7", color: "#605d5d" }, dark: { bg: "#3a3737", color: "#9b9797" } };

const THEME = {
  light: { bg: "#f3f2f2", surface: "#eae9e9", surfaceAlt: "#ffffff", text: "#201e1d", muted: "rgba(32,30,29,0.6)", divider: "rgba(32,30,29,0.4)" },
  dark: { bg: "#201e1d", surface: "#2d2b2b", surfaceAlt: "#3a3737", text: "#f3f2f2", muted: "rgba(243,242,242,0.6)", divider: "rgba(243,242,242,0.35)" },
};

function statusColor(status: string, dark: boolean): string {
  if (status === "New") return dark ? "#ff9783" : "#ae1800";
  if (status === "Applied") return dark ? "#ffc4b8" : "#dd2b0f";
  if (status === "Reviewed") return dark ? "#d7d3d3" : "#605d5d";
  return dark ? "#605d5d" : "#9b9797"; // Rejected / Ignored
}

function daysAgoLabel(dateStr: string | null): string {
  if (!dateStr) return "Date unknown";
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

function matchesLocationFilter(job: DisplayListing, filter: LocationFilter): boolean {
  if (filter === "Remote") return job.workMode === "Remote";
  return job.location.toLowerCase().includes(filter.toLowerCase());
}

function PinIcon({ color }: { color: string }) {
  return (
    <svg width="8" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.58 7-12.5A7 7 0 105 9.5C5 14.42 12 22 12 22z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.2" fill={color} />
    </svg>
  );
}

function ExternalLinkIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M14 5h5v5M19 5L10 14M9 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FitBadge({ score, dark, size = 56 }: { score: number | null; dark: boolean; size?: number }) {
  const badges = dark ? BADGE_DARK : BADGE_LIGHT;
  const { bg, color } = score !== null ? badges[score] : dark ? BADGE_NEUTRAL.dark : BADGE_NEUTRAL.light;
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: "none",
        background: bg,
        color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: size * 0.39, lineHeight: 1 }}>{score ?? "–"}</div>
      <div style={{ fontSize: size * 0.14, letterSpacing: "0.08em", marginTop: 1 }}>/ 5</div>
    </div>
  );
}

function JobRow({ job, dark, onOpen }: { job: DisplayListing; dark: boolean; onOpen: () => void }) {
  const theme = dark ? THEME.dark : THEME.light;
  return (
    <div
      onClick={onOpen}
      className="jft-row"
      style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 14, padding: "16px 20px", borderBottom: `2px solid ${theme.divider}`, cursor: "pointer" }}
    >
      <FitBadge score={job.fitScore} dark={dark} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.25 }}>{job.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{job.company}</span>
          {job.companyLink && (
            <a
              href={job.companyLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", color: theme.muted }}
            >
              <ExternalLinkIcon color="currentColor" />
            </a>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, border: `1.5px solid ${ACCENT}`, color: ACCENT, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em", padding: "3px 9px" }}>
            <PinIcon color={ACCENT} />
            {job.location || "Unknown location"}
          </span>
          {job.workMode !== "Unknown" && (
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em", padding: "3px 9px", background: theme.surfaceAlt, color: theme.muted }}>
              {job.workMode}
            </span>
          )}
        </div>
        {job.pay && <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 7, opacity: 0.75 }}>{job.pay}</div>}
        {job.fitReasoning && (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              margin: "8px 0 0",
              opacity: 0.8,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {job.fitReasoning}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "3px 8px",
              border: `1px solid ${statusColor(job.status, dark)}`,
              color: statusColor(job.status, dark),
            }}
          >
            {job.status}
          </span>
          <div style={{ fontSize: 11, color: theme.muted }}>{daysAgoLabel(job.datePosted)}</div>
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ job, dark, onBack }: { job: DisplayListing; dark: boolean; onBack: () => void }) {
  const theme = dark ? THEME.dark : THEME.light;
  const fitLabel = job.fitScore !== null ? FIT_LABELS[job.fitScore] : "Unscored";

  return (
    <div style={{ padding: "24px 20px 40px", color: theme.text }}>
      <button
        type="button"
        className="jft-btn"
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: theme.text, fontWeight: 800, fontSize: 14, padding: 0, cursor: "pointer" }}
      >
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
          <path d="M8 1L1 7.5L8 14" stroke={theme.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Listings
      </button>
      <div style={{ height: 2, background: theme.divider, margin: "16px 0 18px" }} />

      <h6 style={{ color: ACCENT, margin: "0 0 6px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800 }}>Job detail</h6>
      <h2 style={{ margin: 0, fontSize: 23, fontWeight: 800 }}>{job.title}</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <div style={{ width: 34, height: 34, flex: "none", background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
          {job.company.charAt(0)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{job.company}</div>
        {job.companyLink && (
          <a href={job.companyLink} target="_blank" rel="noreferrer" style={{ display: "flex", color: theme.muted }}>
            <ExternalLinkIcon color="currentColor" />
          </a>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1.5px solid ${ACCENT}`, color: ACCENT, fontSize: 11, fontWeight: 700, padding: "4px 10px" }}>
          <PinIcon color={ACCENT} />
          {job.location || "Unknown location"}
        </span>
        {job.workMode !== "Unknown" && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: theme.surfaceAlt, color: theme.muted }}>{job.workMode}</span>
        )}
      </div>
      {job.pay && <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12 }}>{job.pay}</div>}

      <div style={{ height: 2, background: theme.divider, margin: "20px 0" }} />

      <div style={{ display: "flex", gap: 16 }}>
        <FitBadge score={job.fitScore} dark={dark} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{fitLabel}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: "5px 0 0", opacity: 0.88 }}>{job.fitReasoning}</p>
        </div>
      </div>

      <div style={{ height: 2, background: theme.divider, margin: "20px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${theme.divider}`, fontSize: 13 }}>
        <span style={{ color: theme.muted }}>Posted</span>
        <span style={{ fontWeight: 700 }}>{daysAgoLabel(job.datePosted)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 13 }}>
        <span style={{ color: theme.muted }}>Status</span>
        <span style={{ fontWeight: 700, color: statusColor(job.status, dark) }}>{job.status}</span>
      </div>

      {job.link && (
        <a
          href={job.link}
          target="_blank"
          rel="noreferrer"
          style={{ display: "block", textAlign: "left", marginTop: 22, background: ACCENT, color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 14, padding: "14px 16px" }}
        >
          View original posting
        </a>
      )}
      {job.companyLink && (
        <a
          href={job.companyLink}
          target="_blank"
          rel="noreferrer"
          style={{ display: "block", textAlign: "left", marginTop: 10, border: `1.5px solid ${theme.divider}`, color: theme.text, textDecoration: "none", fontWeight: 800, fontSize: 14, padding: "13px 16px" }}
        >
          Visit company
        </a>
      )}
    </div>
  );
}

function FilterSheet({
  dark,
  activeFilters,
  onToggle,
  onClear,
  onClose,
}: {
  dark: boolean;
  activeFilters: Set<LocationFilter>;
  onToggle: (filter: LocationFilter) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const theme = dark ? THEME.dark : THEME.light;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30 }} />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 31,
          maxWidth: 440,
          margin: "0 auto",
          background: theme.surface,
          borderTop: `2px solid ${theme.divider}`,
          padding: "20px 20px 32px",
          color: theme.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Filter by location</div>
          <button
            type="button"
            className="jft-btn"
            onClick={onClose}
            style={{ background: "none", border: "none", color: theme.text, fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 0 }}
          >
            &times;
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          {LOCATION_FILTERS.map((loc) => {
            const checked = activeFilters.has(loc);
            return (
              <div
                key={loc}
                onClick={() => onToggle(loc)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${theme.divider}`, cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 19,
                    height: 19,
                    flex: "none",
                    border: `1.5px solid ${checked ? ACCENT : theme.divider}`,
                    background: checked ? ACCENT : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {checked && (
                    <svg width="11" height="9" viewBox="0 0 24 20" fill="none">
                      <path d="M1 10l7 7L23 1" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{loc}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            type="button"
            className="jft-btn"
            onClick={onClear}
            style={{ flex: 1, border: `1.5px solid ${theme.divider}`, background: "transparent", color: theme.text, fontWeight: 800, fontSize: 13, padding: 12, cursor: "pointer" }}
          >
            Clear
          </button>
          <button
            type="button"
            className="jft-btn"
            onClick={onClose}
            style={{ flex: 1, border: "none", background: ACCENT, color: "#fff", fontWeight: 800, fontSize: 13, padding: 12, cursor: "pointer" }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

export function JobFitApp({ jobs }: { jobs: DisplayListing[] }) {
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<LocationFilter>>(new Set());

  const theme = dark ? THEME.dark : THEME.light;

  const toggleFilter = (filter: LocationFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const base = activeFilters.size === 0 ? jobs : jobs.filter((job) => [...activeFilters].some((f) => matchesLocationFilter(job, f)));
    return [...base].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
  }, [jobs, activeFilters]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const filterLabel = activeFilters.size === 0 ? "All" : [...activeFilters].join(", ");
  const isEmpty = filtered.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <div style={{ maxWidth: 440, margin: "0 auto", position: "relative" }}>
        {screen === "list" && (
          <>
            <div style={{ padding: "32px 20px 4px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Listings</h3>
                  <div style={{ fontSize: 12, marginTop: 2, color: theme.muted }}>
                    {activeFilters.size === 0 ? `${filtered.length} roles` : `${filtered.length} of ${jobs.length} roles`}
                  </div>
                </div>
                <button
                  type="button"
                  className="jft-btn"
                  onClick={() => setDark((d) => !d)}
                  style={{ width: 36, height: 36, flex: "none", border: `1.5px solid ${theme.divider}`, background: "transparent", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {dark ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="5" stroke={theme.text} strokeWidth="2" />
                      <g stroke={theme.text} strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                      </g>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke={theme.text} strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ height: 2, background: theme.divider, marginTop: 14 }} />
            </div>

            <div style={{ padding: "12px 20px 6px" }}>
              <button
                type="button"
                className="jft-btn"
                onClick={() => setSheetOpen(true)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1.5px solid ${theme.divider}`, background: "transparent", color: theme.text, fontWeight: 800, fontSize: 13, padding: "11px 14px", cursor: "pointer" }}
              >
                <span>Location &middot; {filterLabel}</span>
                <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
                  <path d="M1 1l4.5 5L10 1" stroke={theme.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {isEmpty ? (
              <div style={{ padding: "64px 28px", textAlign: "center" }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto" }}>
                  <circle cx="11" cy="11" r="7" stroke={theme.muted} strokeWidth="2" />
                  <line x1="21" y1="21" x2="16.5" y2="16.5" stroke={theme.muted} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 16 }}>{jobs.length === 0 ? "No listings yet" : "No roles match these filters"}</div>
                <div style={{ fontSize: 13, marginTop: 6, color: theme.muted }}>
                  {jobs.length === 0 ? "They'll show up here once the scheduled job runs." : "Try clearing a filter to see more roles."}
                </div>
                {activeFilters.size > 0 && (
                  <button
                    type="button"
                    className="jft-btn"
                    onClick={() => setActiveFilters(new Set())}
                    style={{ marginTop: 18, border: `1.5px solid ${ACCENT}`, color: ACCENT, background: "transparent", fontWeight: 800, fontSize: 12, padding: "9px 16px", cursor: "pointer" }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filtered.map((job) => (
                  <JobRow key={job.id} job={job} dark={dark} onOpen={() => { setSelectedJobId(job.id); setScreen("detail"); }} />
                ))}
              </div>
            )}
          </>
        )}

        {screen === "detail" && selectedJob && (
          <DetailScreen job={selectedJob} dark={dark} onBack={() => setScreen("list")} />
        )}

        {sheetOpen && (
          <FilterSheet
            dark={dark}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters(new Set())}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
