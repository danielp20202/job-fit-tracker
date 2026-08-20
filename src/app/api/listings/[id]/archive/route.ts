import { NextRequest, NextResponse } from "next/server";
import { setListingArchived } from "@/lib/notion";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/listings/[id]/archive">) {
  const { id } = await ctx.params;

  let archived = true;
  try {
    const body = await request.json();
    if (typeof body?.archived === "boolean") archived = body.archived;
  } catch {
    // No body / not JSON — default to archiving (the common case, used by the "Archive" button).
  }

  await setListingArchived(id, archived);
  return NextResponse.json({ id, archived });
}
