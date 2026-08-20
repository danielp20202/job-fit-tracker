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

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const secret = process.env.RSS_APP_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("rssapp-signature");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    console.log("[rss-webhook-debug]", {
      allHeaders: Array.from(request.headers.keys()),
      rssappSignatureHeader: signature,
      expectedHex: expected,
      bodyPreview: rawBody.slice(0, 300),
      bodyLength: rawBody.length,
    });
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
