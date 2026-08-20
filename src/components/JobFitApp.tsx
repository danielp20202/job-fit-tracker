"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DisplayListing } from "@/lib/notion";

export const ACCENT = "#ec3013";
export const ACCENT_700 = "#ae1800";
export const GOLD = "#f5b700";
export const GOLD_DARK = "#3d2e00";
const LOCATION_FILTERS = ["Montreal", "Ottawa", "Toronto"] as const;
type LocationFilter = (typeof LOCATION_FILTERS)[number];
const WORK_MODE_FILTERS = ["Remote", "Hybrid", "Onsite"] as const;
type WorkModeFilter = (typeof WORK_MODE_FILTERS)[number];
type SortBy = "fit" | "recent" | "company";

export const FIT_LABELS: Record<number, string> = {
  5: "Great fit",
  4: "Good fit",
  3: "Possible fit",
  2: "Weak fit",
  1: "Poor fit",
};

export const BADGE_LIGHT: Record<number, { bg: string; color: string }> = {
  5: { bg: "#dd2b0f", color: "#ffffff" },
  4: { bg: "#ffc4b8", color: "#7c1405" },
  3: { bg: "#d7d3d3", color: "#444141" },
  2: { bg: "#eae7e7", color: "#605d5d" },
  1: { bg: "#f8f4f4", color: "#7d7979" },
};
export const BADGE_DARK: Record<number, { bg: string; color: string }> = {
  5: { bg: "#ff9783", color: "#201e1d" },
  4: { bg: "#7c1405", color: "#ffc4b8" },
  3: { bg: "#444141", color: "#d7d3d3" },
  2: { bg: "#2d2b2b", color: "#9b9797" },
  1: { bg: "#201e1d", color: "#605d5d" },
};
export const BADGE_NEUTRAL = { light: { bg: "#eae7e7", color: "#605d5d" }, dark: { bg: "#3a3737", color: "#9b9797" } };

export const THEME = {
  light: { bg: "#f3f2f2", surface: "#eae9e9", surfaceAlt: "#ffffff", text: "#201e1d", muted: "rgba(32,30,29,0.6)", divider: "rgba(32,30,29,0.4)" },
  dark: { bg: "#201e1d", surface: "#2d2b2b", surfaceAlt: "#3a3737", text: "#f3f2f2", muted: "rgba(243,242,242,0.6)", divider: "rgba(243,242,242,0.35)" },
};

export function statusColor(status: string, dark: boolean): string {
  if (status === "New") return dark ? "#ff9783" : "#ae1800";
  if (status === "Applied") return dark ? "#ffc4b8" : "#dd2b0f";
  if (status === "Reviewed") return dark ? "#d7d3d3" : "#605d5d";
  return dark ? "#605d5d" : "#9b9797"; // Rejected / Ignored
}

export function daysAgoLabel(dateStr: string | null): string {
  if (!dateStr) return "Date unknown";
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

/** Fit scores can be decimals (e.g. 4.9); badge color/label buckets are still 1-5 integer tiers. */
export function scoreTier(score: number): number {
  return Math.min(5, Math.max(1, Math.round(score)));
}

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function matchesLocationFilter(job: DisplayListing, filter: LocationFilter): boolean {
  return job.location.toLowerCase().includes(filter.toLowerCase());
}

function matchesWorkModeFilter(job: DisplayListing, filter: WorkModeFilter): boolean {
  return job.workMode === filter;
}

const FIT_SCORE_FILTERS = [5, 4, 3, 2, 1] as const;
type FitScoreFilter = (typeof FIT_SCORE_FILTERS)[number];

function matchesFitScoreFilter(job: DisplayListing, tier: FitScoreFilter): boolean {
  return job.fitScore !== null && scoreTier(job.fitScore) === tier;
}

export function PinIcon({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.58 7-12.5A7 7 0 105 9.5C5 14.42 12 22 12 22z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.2" fill={color} />
    </svg>
  );
}

export function BuildingIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16v4H4V4zm0 6h16v10H4V10z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M12 7v5l4 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ fill }: { fill: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2l2.9 6.3 6.9.9-5 4.8 1.3 6.8L12 17.7 5.9 20.8l1.3-6.8-5-4.8 6.9-.9L12 2z" />
    </svg>
  );
}

export function ExternalLinkIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M14 5h5v5M19 5L10 14M9 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 24 20" fill="none">
      <path d="M1 10l7 7L23 1" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
      <path d="M1 1l4.5 5L10 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Rare and high-value, so deliberately distinct from the rest of the (red-only) palette — gold, not accent red. */
export function VisaSponsorshipBadge({ size = "normal" }: { size?: "normal" | "large" }) {
  const fontSize = size === "large" ? 12 : 10.5;
  const padding = size === "large" ? "5px 12px" : "3px 9px";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: GOLD,
        color: GOLD_DARK,
        fontWeight: 800,
        fontSize,
        letterSpacing: "0.02em",
        padding,
        border: `1.5px solid ${GOLD_DARK}`,
      }}
    >
      <StarIcon fill={GOLD_DARK} />
      Visa Sponsorship
    </span>
  );
}

/** btn-secondary look, matching the Modernist design system's button classes (replicated as inline styles, see docs/architecture.md on why we don't import the raw CSS). */
export function secondaryBtnStyle(theme: typeof THEME.light): React.CSSProperties {
  return { border: `1.5px solid ${theme.divider}`, background: "transparent", color: theme.text, fontWeight: 800, cursor: "pointer" };
}
export function ghostBtnStyle(color: string): React.CSSProperties {
  return { border: "none", background: "none", color, fontWeight: 800, cursor: "pointer", padding: 0 };
}
export function primaryBtnStyle(): React.CSSProperties {
  return { border: "none", background: ACCENT, color: "#fff", fontWeight: 800, cursor: "pointer" };
}
export function tagStyle(theme: typeof THEME.light): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, padding: "3px 9px", background: theme.surfaceAlt, color: theme.muted };
}

interface FilterOption {
  label: string;
  isChecked: boolean;
  count: number;
  toggle: () => void;
}

function FilterOptionRow({ loc, theme, size = 16 }: { loc: FilterOption; theme: typeof THEME.light; size?: number }) {
  return (
    <div
      onClick={loc.toggle}
      className="jft-loc"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 6px", cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: size,
            height: size,
            flex: "none",
            border: `1.5px solid ${loc.isChecked ? ACCENT : theme.divider}`,
            background: loc.isChecked ? ACCENT : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loc.isChecked && <CheckIcon size={size * 0.56} />}
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{loc.label}</span>
      </div>
      <span style={{ fontSize: 12, color: theme.muted }}>{loc.count}</span>
    </div>
  );
}

export function FitBadge({ score, dark, size = 56 }: { score: number | null; dark: boolean; size?: number }) {
  const badges = dark ? BADGE_DARK : BADGE_LIGHT;
  const { bg, color } = score !== null ? badges[scoreTier(score)] : dark ? BADGE_NEUTRAL.dark : BADGE_NEUTRAL.light;
  return (
    <div style={{ width: size, height: size, flex: "none", background: bg, color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontWeight: 800, fontSize: size * 0.39, lineHeight: 1 }}>{score !== null ? formatScore(score) : "–"}</div>
      <div style={{ fontSize: size * 0.14, letterSpacing: "0.08em", marginTop: 1 }}>/ 5</div>
    </div>
  );
}

function JobCard({
  job,
  theme,
  dark,
  active,
  rowPad,
  onOpen,
}: {
  job: DisplayListing;
  theme: typeof THEME.light;
  dark: boolean;
  active: boolean;
  rowPad: string;
  onOpen: () => void;
}) {
  const badges = dark ? BADGE_DARK : BADGE_LIGHT;
  const badgeBg = job.fitScore !== null ? badges[scoreTier(job.fitScore)].bg : (dark ? BADGE_NEUTRAL.dark : BADGE_NEUTRAL.light).bg;
  return (
    <div
      onClick={onOpen}
      className="jft-row"
      style={{
        border: job.visaSponsorship ? `2px solid ${GOLD}` : `1.5px solid ${theme.divider}`,
        padding: rowPad,
        cursor: "pointer",
        background: active ? theme.surfaceAlt : "transparent",
      }}
    >
      {job.visaSponsorship && (
        <div style={{ marginBottom: 10 }}>
          <VisaSponsorshipBadge />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: ACCENT_700, fontWeight: 800, fontSize: 12 }}>
          <PinIcon color={ACCENT_700} size={12} />
          {job.location || "Unknown location"}
        </span>
        <span style={{ color: theme.divider }}>|</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.muted, fontWeight: 700 }}>
          <BuildingIcon color="currentColor" />
          {job.company}
        </span>
        {job.companyLink && (
          <a href={job.companyLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "flex", color: theme.muted }}>
            <ExternalLinkIcon color="currentColor" />
          </a>
        )}
      </div>

      <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, marginTop: 8 }}>{job.title}</div>

      {job.fitReasoning && (
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.5,
            margin: "8px 0 0",
            opacity: 0.8,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {job.fitReasoning}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: theme.muted }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <ClockIcon color="currentColor" />
          {daysAgoLabel(job.datePosted)}
        </span>
        {job.workMode !== "Unknown" && <span style={tagStyle(theme)}>{job.workMode}</span>}
        {job.pay && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: theme.text, opacity: 0.75 }}>{job.pay}</span>}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: ACCENT_700, fontWeight: 700 }}>
          <StarIcon fill={badgeBg} />
          {job.fitScore !== null ? formatScore(job.fitScore) : "–"}/5 fit
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "3px 8px",
            border: `1px solid ${statusColor(job.status, dark)}`,
            color: statusColor(job.status, dark),
            marginLeft: "auto",
          }}
        >
          {job.status}
        </span>
      </div>
    </div>
  );
}

function DetailPane({
  job,
  theme,
  dark,
  pad,
  showBack,
  showClose,
  onBack,
  onClose,
  onArchive,
  archiving,
}: {
  job: DisplayListing;
  theme: typeof THEME.light;
  dark: boolean;
  pad: string;
  showBack: boolean;
  showClose: boolean;
  onBack: () => void;
  onClose: () => void;
  onArchive: () => void;
  archiving: boolean;
}) {
  const fitLabel = job.fitScore !== null ? FIT_LABELS[scoreTier(job.fitScore)] : "Unscored";

  return (
    <div style={{ padding: pad, color: theme.text }}>
      {showBack && (
        <button type="button" className="jft-btn" onClick={onBack} style={{ ...ghostBtnStyle(theme.text), display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 16 }}>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1 7.5L8 14" stroke={theme.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Listings
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h6 style={{ color: ACCENT, margin: "0 0 6px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800 }}>Job detail</h6>
        {showClose && (
          <button type="button" className="jft-btn" onClick={onClose} style={{ ...ghostBtnStyle(theme.text), fontSize: 18, lineHeight: 1, marginBottom: 6 }}>
            &times;
          </button>
        )}
      </div>
      <h2 style={{ margin: 0, fontSize: 23, fontWeight: 800 }}>{job.title}</h2>

      {job.visaSponsorship && (
        <div style={{ marginTop: 10 }}>
          <VisaSponsorshipBadge size="large" />
        </div>
      )}

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
          <PinIcon color={ACCENT} size={9} />
          {job.location || "Unknown location"}
        </span>
        {job.workMode !== "Unknown" && <span style={tagStyle(theme)}>{job.workMode}</span>}
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
        <a href={job.link} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "left", marginTop: 22, textDecoration: "none", padding: "14px 16px", ...primaryBtnStyle() }}>
          View original posting
        </a>
      )}
      {job.companyLink && (
        <a
          href={job.companyLink}
          target="_blank"
          rel="noreferrer"
          style={{ display: "block", textAlign: "left", marginTop: 10, textDecoration: "none", padding: "13px 16px", ...secondaryBtnStyle(theme) }}
        >
          Visit company
        </a>
      )}
      <button
        type="button"
        className="jft-btn"
        onClick={onArchive}
        disabled={archiving}
        style={{ display: "block", width: "100%", textAlign: "left", marginTop: 10, padding: "13px 16px", opacity: archiving ? 0.6 : 1, ...secondaryBtnStyle(theme) }}
      >
        {archiving ? "Archiving…" : "Archive"}
      </button>
    </div>
  );
}

function FilterSheet({
  theme,
  workModes,
  locations,
  fitScores,
  onClear,
  onClose,
}: {
  theme: typeof THEME.light;
  workModes: FilterOption[];
  locations: FilterOption[];
  fitScores: FilterOption[];
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30 }} />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 31, background: theme.surface, borderTop: `2px solid ${theme.divider}`, padding: "20px 20px 40px", maxWidth: 480, margin: "0 auto", color: theme.text, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Filters</div>
          <button type="button" className="jft-btn" onClick={onClose} style={{ ...ghostBtnStyle(theme.text), fontSize: 20, lineHeight: 1 }}>
            &times;
          </button>
        </div>

        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.muted, margin: "16px 0 4px" }}>Fit Score</div>
        <div>
          {fitScores.map((fs) => (
            <FilterOptionRow key={fs.label} loc={fs} theme={theme} size={19} />
          ))}
        </div>

        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.muted, margin: "16px 0 4px" }}>Work Mode</div>
        <div>
          {workModes.map((wm) => (
            <FilterOptionRow key={wm.label} loc={wm} theme={theme} size={19} />
          ))}
        </div>

        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.muted, margin: "16px 0 4px" }}>Location</div>
        <div>
          {locations.map((loc) => (
            <FilterOptionRow key={loc.label} loc={loc} theme={theme} size={19} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" className="jft-btn" onClick={onClear} style={{ flex: 1, padding: 12, ...secondaryBtnStyle(theme) }}>
            Clear
          </button>
          <button type="button" className="jft-btn" onClick={onClose} style={{ flex: 1, padding: 12, ...primaryBtnStyle() }}>
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
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState(false);
  const allJobs = useMemo(() => jobs.filter((j) => !archivedIds.has(j.id)), [jobs, archivedIds]);
  const [activeLocationFilters, setActiveLocationFilters] = useState<Set<LocationFilter>>(new Set());
  const [activeWorkModeFilters, setActiveWorkModeFilters] = useState<Set<WorkModeFilter>>(new Set());
  const [activeFitScoreFilters, setActiveFitScoreFilters] = useState<Set<FitScoreFilter>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("fit");
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const theme = dark ? THEME.dark : THEME.light;
  const isDesktop = width >= 860;
  const isSplit = isDesktop;
  const isTabletUp = width >= 640;

  const toggleLocationFilter = (filter: LocationFilter) => {
    setActiveLocationFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };
  const toggleWorkModeFilter = (filter: WorkModeFilter) => {
    setActiveWorkModeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };
  const toggleFitScoreFilter = (filter: FitScoreFilter) => {
    setActiveFitScoreFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };
  const clearAllFilters = () => {
    setActiveLocationFilters(new Set());
    setActiveWorkModeFilters(new Set());
    setActiveFitScoreFilters(new Set());
  };

  const activeFilterCount = activeLocationFilters.size + activeWorkModeFilters.size + activeFitScoreFilters.size;

  const filtered = useMemo(() => {
    return allJobs.filter((job) => {
      const locationOk = activeLocationFilters.size === 0 || [...activeLocationFilters].some((f) => matchesLocationFilter(job, f));
      const workModeOk = activeWorkModeFilters.size === 0 || [...activeWorkModeFilters].some((f) => matchesWorkModeFilter(job, f));
      const fitScoreOk = activeFitScoreFilters.size === 0 || [...activeFitScoreFilters].some((f) => matchesFitScoreFilter(job, f));
      return locationOk && workModeOk && fitScoreOk;
    });
  }, [allJobs, activeLocationFilters, activeWorkModeFilters, activeFitScoreFilters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const byFit = (a: DisplayListing, b: DisplayListing) => (b.fitScore ?? 0) - (a.fitScore ?? 0);
    const byRecent = (a: DisplayListing, b: DisplayListing) => new Date(b.datePosted ?? 0).getTime() - new Date(a.datePosted ?? 0).getTime();
    list.sort((a, b) => {
      // Visa sponsorship is rare and high-value -- always bubbles to the top, ahead of whatever sort is active.
      const visaDiff = Number(b.visaSponsorship) - Number(a.visaSponsorship);
      if (visaDiff !== 0) return visaDiff;
      if (sortBy === "company") return a.company.localeCompare(b.company);
      // Fit and Recent are each other's tiebreaker: sorting by fit score still orders equal-scored
      // roles by recency, and sorting by recency still orders same-day roles by fit score.
      if (sortBy === "recent") return byRecent(a, b) || byFit(a, b);
      return byFit(a, b) || byRecent(a, b);
    });
    return list;
  }, [filtered, sortBy]);

  const selectedJob = allJobs.find((j) => j.id === selectedJobId) ?? null;
  const filterLabel =
    activeFilterCount === 0
      ? "All"
      : [...activeFitScoreFilters].map((t) => FIT_LABELS[t]).concat([...activeWorkModeFilters], [...activeLocationFilters]).join(", ");
  const isEmpty = sorted.length === 0;
  const rowPad = "16px 20px";

  const workModes: FilterOption[] = WORK_MODE_FILTERS.map((label) => ({
    label,
    isChecked: activeWorkModeFilters.has(label),
    count: allJobs.filter((j) => matchesWorkModeFilter(j, label)).length,
    toggle: () => toggleWorkModeFilter(label),
  }));

  const locations: FilterOption[] = LOCATION_FILTERS.map((label) => ({
    label,
    isChecked: activeLocationFilters.has(label),
    count: allJobs.filter((j) => matchesLocationFilter(j, label)).length,
    toggle: () => toggleLocationFilter(label),
  }));

  const fitScores: FilterOption[] = FIT_SCORE_FILTERS.map((tier) => ({
    label: FIT_LABELS[tier],
    isChecked: activeFitScoreFilters.has(tier),
    count: allJobs.filter((j) => matchesFitScoreFilter(j, tier)).length,
    toggle: () => toggleFitScoreFilter(tier),
  }));

  const screenList = isSplit ? true : screen === "list";
  const screenDetail = !!selectedJob && (isSplit ? true : screen === "detail");

  const openDetail = (id: string) => {
    setSelectedJobId(id);
    setScreen("detail");
  };
  const goBack = () => setScreen("list");
  const clearSelection = () => {
    setSelectedJobId(null);
    setScreen("list");
  };
  const archiveJob = async (id: string) => {
    setArchiving(true);
    try {
      await fetch(`/api/listings/${id}/archive`, { method: "POST" });
      setArchivedIds((prev) => new Set(prev).add(id));
      setSelectedJobId(null);
      setScreen("list");
    } finally {
      setArchiving(false);
    }
  };

  const listMaxWidth = isSplit ? (width >= 1150 ? "520px" : "400px") : "none";
  const detailPad = isSplit ? "0 0 40px" : "58px 20px 40px";

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `2px solid ${theme.divider}` }}>
        <div>
          <h6 style={{ color: ACCENT, margin: "0 0 3px", fontSize: 11 }}>Personal tool</h6>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>Job Fit Tracker</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/archive"
            className="jft-btn"
            style={{ height: 38, display: "flex", alignItems: "center", padding: "0 14px", textDecoration: "none", fontSize: 13, fontWeight: 700, ...secondaryBtnStyle(theme) }}
          >
            Archive
          </Link>
          <button type="button" className="jft-btn" onClick={() => setDark((d) => !d)} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", ...secondaryBtnStyle(theme) }}>
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
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 24, maxWidth: 1180, margin: "0 auto", padding: 24 }}>
        {/* Desktop sidebar */}
        <div style={{ width: 180, flex: "none", display: isDesktop ? "flex" : "none", flexDirection: "column", position: "sticky", top: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: `2px solid ${theme.divider}`, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 5h18M6 12h12M10 19h4" stroke={theme.text} strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Filters
            </div>
            {activeFilterCount > 0 && (
              <button type="button" className="jft-btn" onClick={clearAllFilters} style={{ ...ghostBtnStyle(ACCENT), fontSize: 12 }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.muted, marginBottom: 10 }}>Fit Score</div>
          {fitScores.map((fs) => (
            <FilterOptionRow key={fs.label} loc={fs} theme={theme} size={16} />
          ))}
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.muted, margin: "14px 0 10px" }}>Work Mode</div>
          {workModes.map((wm) => (
            <FilterOptionRow key={wm.label} loc={wm} theme={theme} size={16} />
          ))}
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.muted, margin: "14px 0 10px" }}>Location</div>
          {locations.map((loc) => (
            <FilterOptionRow key={loc.label} loc={loc} theme={theme} size={16} />
          ))}
        </div>

        {/* Mobile filter trigger */}
        <div style={{ width: isTabletUp ? "480px" : "100%", flex: "none", display: isDesktop ? "none" : "block" }}>
          <button
            type="button"
            className="jft-btn"
            onClick={() => setSheetOpen(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", ...secondaryBtnStyle(theme) }}
          >
            <span>Filters &middot; {filterLabel}</span>
            <ChevronDownIcon color={theme.text} />
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* List pane */}
          <div style={{ flex: 1, minWidth: 220, maxWidth: listMaxWidth }}>
            {screenList && (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {activeFilterCount === 0 ? `${sorted.length} roles` : `${sorted.length} of ${allJobs.length} roles`}
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    style={{ border: `1.5px solid ${theme.divider}`, background: "transparent", color: theme.text, fontWeight: 700, fontSize: 12, padding: "7px 10px", cursor: "pointer" }}
                  >
                    <option value="fit">Sort by: Fit score</option>
                    <option value="recent">Sort by: Most recent</option>
                    <option value="company">Sort by: Company A–Z</option>
                  </select>
                </div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 4 }}>Refine by work mode or location to narrow results.</div>
                <div style={{ height: 2, background: theme.divider, margin: "12px 0 16px" }} />

                {isEmpty ? (
                  <div style={{ padding: "64px 28px", textAlign: "center" }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto" }}>
                      <circle cx="11" cy="11" r="7" stroke={theme.muted} strokeWidth="2" />
                      <line x1="21" y1="21" x2="16.5" y2="16.5" stroke={theme.muted} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <div style={{ fontWeight: 800, fontSize: 15, marginTop: 16 }}>{allJobs.length === 0 ? "No listings yet" : "No roles match these filters"}</div>
                    <div style={{ fontSize: 13, marginTop: 6, color: theme.muted }}>
                      {allJobs.length === 0 ? "They'll show up here once the scheduled job runs." : "Try clearing a filter to see more roles."}
                    </div>
                    {activeFilterCount > 0 && (
                      <button type="button" className="jft-btn" onClick={clearAllFilters} style={{ marginTop: 18, padding: "9px 16px", ...secondaryBtnStyle(theme) }}>
                        Reset filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {sorted.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        theme={theme}
                        dark={dark}
                        active={isSplit && job.id === selectedJobId}
                        rowPad={rowPad}
                        onOpen={() => openDetail(job.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail pane */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 240,
              display: isSplit ? "block" : screen === "detail" ? "block" : "none",
              position: isSplit ? "sticky" : "fixed",
              inset: isSplit ? "auto" : 0,
              top: isSplit ? 24 : 0,
              maxHeight: isSplit ? "calc(100vh - 48px)" : "none",
              zIndex: 40,
              background: theme.bg,
              overflowY: "auto",
            }}
          >
            {screenDetail && selectedJob ? (
              <DetailPane
                job={selectedJob}
                theme={theme}
                dark={dark}
                pad={detailPad}
                showBack={!isSplit}
                showClose={isSplit}
                onBack={goBack}
                onClose={clearSelection}
                onArchive={() => archiveJob(selectedJob.id)}
                archiving={archiving}
              />
            ) : (
              isSplit &&
              !selectedJob && (
                <div style={{ padding: "80px 28px", textAlign: "center", color: theme.muted }}>
                  <div style={{ fontSize: 13 }}>Select a role to see its fit breakdown</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {sheetOpen && <FilterSheet theme={theme} workModes={workModes} locations={locations} fitScores={fitScores} onClear={clearAllFilters} onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
