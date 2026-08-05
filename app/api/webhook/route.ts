import { NextRequest, NextResponse } from "next/server";
import { broadcastWebhookEvent } from "@/lib/events";
import { WasenderWebhookPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    // Optional webhook secret verification if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get("x-wasender-signature") || req.headers.get("x-signature");
      if (signature && signature !== webhookSecret) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: WasenderWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log(`[Webhook] Event received: ${payload.event || "unknown"}`);

    // Broadcast event to connected SSE clients in the dashboard
    broadcastWebhookEvent(payload);

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Wasender Webhook Endpoint is Active. Send POST requests with Wasender webhook payloads here.",
  });
}
