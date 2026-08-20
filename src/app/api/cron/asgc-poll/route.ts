import { NextRequest, NextResponse } from "next/server";
import { fetchAsgcCanadaSupportJobs, ASGC_FEED_TITLE } from "@/lib/asgc";
import { createInboxItems, getInboxUrlsForFeed } from "@/lib/notion";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [jobs, existingUrls] = await Promise.all([fetchAsgcCanadaSupportJobs(), getInboxUrlsForFeed(ASGC_FEED_TITLE)]);

  const newJobs = jobs.filter((job) => job.url && !existingUrls.has(job.url));
  await createInboxItems(newJobs);

  return NextResponse.json({ found: jobs.length, alreadySeen: jobs.length - newJobs.length, added: newJobs.length });
}
