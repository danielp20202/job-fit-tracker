"use client";

import { useState } from "react";
import Link from "next/link";
import type { DisplayListing } from "@/lib/notion";
import {
  ACCENT,
  ACCENT_700,
  THEME,
  BADGE_LIGHT,
  BADGE_DARK,
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
  tagStyle,
} from "@/components/JobFitApp";

export function ArchiveApp({ jobs }: { jobs: DisplayListing[] }) {
  const [dark] = useState(false);
  const [restoredIds, setRestoredIds] = useState<Set<string>>(new Set());
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const theme = dark ? THEME.dark : THEME.light;
  const badges = dark ? BADGE_DARK : BADGE_LIGHT;

  const visible = jobs.filter((j) => !restoredIds.has(j.id));

  const restore = async (id: string) => {
    setRestoringId(id);
    try {
      await fetch(`/api/listings/${id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      setRestoredIds((prev) => new Set(prev).add(id));
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
        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>
          {visible.length === 0 ? "No archived listings." : `${visible.length} archived listing${visible.length === 1 ? "" : "s"}`}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((job) => {
            const badgeBg = job.fitScore !== null ? badges[scoreTier(job.fitScore)].bg : (dark ? BADGE_NEUTRAL.dark : BADGE_NEUTRAL.light).bg;
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
