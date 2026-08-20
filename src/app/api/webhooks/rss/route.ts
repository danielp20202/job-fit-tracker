import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Client } from "@notionhq/client";

export const runtime = "nodejs";

const INBOX_DATA_SOURCE_ID = process.env.NOTION_INBOX_DATA_SOURCE_ID ?? "";

interface RssAppItem {
  url: string;
  title: string;
  description_text?: string;
  date_published?: string;
}

interface RssAppWebhookPayload {
  type: string;
  feed?: { title?: string };
  data?: { items_new?: RssAppItem[] };
}

const SIGNATURE_TOLERANCE_SECONDS = 600;

/**
 * rss.app signs with a Stripe-style scheme: header is "t=<unix_ts>,v1=<hex>",
 * where v1 = HMAC-SHA256(secret, `${t}.${rawBody}`), not HMAC(secret, rawBody).
 */
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const sigBuf = Buffer.from(v1);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const secret = process.env.RSS_APP_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("rssapp-signature");
    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: RssAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const items = payload.data?.items_new ?? [];
  if (items.length === 0) {
    return NextResponse.json({ received: 0 });
  }

  const client = new Client({ auth: process.env.NOTION_API_KEY });
  const feedTitle = payload.feed?.title ?? "";

  await Promise.all(
    items.map((item) =>
      client.pages.create({
        parent: { data_source_id: INBOX_DATA_SOURCE_ID },
        properties: {
          Title: { title: [{ text: { content: item.title || "Untitled" } }] },
          URL: { url: item.url || null },
          Description: { rich_text: [{ text: { content: (item.description_text ?? "").slice(0, 2000) } }] },
          "Feed Title": { rich_text: [{ text: { content: feedTitle } }] },
          ...(item.date_published
            ? { "Date Published": { date: { start: new Date(item.date_published).toISOString() } } }
            : {}),
        } as never,
      })
    )
  );

  return NextResponse.json({ received: items.length });
}
