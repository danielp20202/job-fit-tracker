"use client";

import { useState } from "react";
import Link from "next/link";
import type { DisplayListing } from "@/lib/notion";
import {
  ACCENT,
  ACCENT_700,
  THEME,
  BADGE_LIGHT,
  BADGE_NEUTRAL,
  scoreTier,
  formatScore,
  daysAgoLabel,
  PinIcon,
  BuildingIcon,
  ClockIcon,
  StarIcon,
  ExternalLinkIcon,
  VisaSponsorshipBadge,
  secondaryBtnStyle,
  ghostBtnStyle,
  tagStyle,
} from "@/components/JobFitApp";

export function ArchiveApp({ jobs }: { jobs: DisplayListing[] }) {
  const [restoredIds, setRestoredIds] = useState<Set<string>>(new Set());
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorId, setErrorId] = useState<string | null>(null);
  const theme = THEME.light;

  const notRestored = jobs.filter((j) => !restoredIds.has(j.id));
  const q = searchQuery.trim().toLowerCase();
  const visible =
    q === ""
      ? notRestored
      : notRestored.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));

  const restore = async (id: string) => {
    setRestoringId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/listings/${id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) throw new Error("Restore failed");
      setRestoredIds((prev) => new Set(prev).add(id));
    } catch {
      setErrorId(id);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `2px solid ${theme.divider}` }}>
        <div>
          <h6 style={{ color: ACCENT, margin: "0 0 3px", fontSize: 11 }}>Personal tool</h6>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>Archive</h1>
        </div>
        <Link
          href="/"
          className="jft-btn"
          style={{ height: 38, display: "flex", alignItems: "center", padding: "0 14px", textDecoration: "none", fontSize: 13, fontWeight: 700, ...secondaryBtnStyle(theme) }}
        >
          Back to listings
        </Link>
      </div>

      <div className="max-w-[440px] sm:max-w-[600px] lg:max-w-[680px] mx-auto" style={{ padding: 24 }}>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", color: theme.muted, pointerEvents: "none" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, company, or location"
            style={{
              width: "100%",
              border: `1.5px solid ${theme.divider}`,
              background: "transparent",
              color: theme.text,
              fontSize: 13,
              fontFamily: "inherit",
              padding: "10px 12px 10px 36px",
            }}
          />
          {searchQuery !== "" && (
            <button
              type="button"
              className="jft-btn"
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", ...ghostBtnStyle(theme.text), fontSize: 16, lineHeight: 1, padding: "4px 8px" }}
            >
              &times;
            </button>
          )}
        </div>

        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>
          {notRestored.length === 0
            ? "No archived listings."
            : visible.length === 0
              ? "No archived listings match your search."
              : `${visible.length} of ${notRestored.length} archived listing${notRestored.length === 1 ? "" : "s"}`}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((job) => {
            const badgeBg = job.fitScore !== null ? BADGE_LIGHT[scoreTier(job.fitScore)].bg : BADGE_NEUTRAL.bg;
            return (
              <div key={job.id} style={{ border: `1.5px solid ${theme.divider}`, padding: "16px 20px" }}>
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
                    <a href={job.companyLink} target="_blank" rel="noreferrer" style={{ display: "flex", color: theme.muted }}>
                      <ExternalLinkIcon color="currentColor" />
                    </a>
                  )}
                </div>

                <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, marginTop: 8 }}>{job.title}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: theme.muted }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ClockIcon color="currentColor" />
                    {daysAgoLabel(job.datePosted)}
                  </span>
                  {job.workMode !== "Unknown" && <span style={tagStyle(theme)}>{job.workMode}</span>}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: ACCENT_700, fontWeight: 700 }}>
                    <StarIcon fill={badgeBg} />
                    {job.fitScore !== null ? formatScore(job.fitScore) : "–"}/5 fit
                  </span>
                </div>

                {job.link && (
                  <a href={job.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: theme.muted, marginTop: 10, display: "inline-block" }}>
                    View original posting
                  </a>
                )}

                {errorId === job.id && (
                  <div style={{ fontSize: 12, color: ACCENT_700, marginTop: 10 }}>Couldn&apos;t restore — try again.</div>
                )}
                <button
                  type="button"
                  className="jft-btn"
                  onClick={() => restore(job.id)}
                  disabled={restoringId === job.id}
                  style={{ display: "block", width: "100%", textAlign: "left", marginTop: 12, padding: "11px 16px", opacity: restoringId === job.id ? 0.6 : 1, ...secondaryBtnStyle(theme) }}
                >
                  {restoringId === job.id ? "Restoring…" : "Restore"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
