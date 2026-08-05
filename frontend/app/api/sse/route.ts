import { NextRequest } from "next/server";
import { eventBus } from "@/lib/events";
import { WasenderWebhookPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", time: new Date().toISOString() })}\n\n`)
      );

      const onWasenderEvent = (payload: WasenderWebhookPayload) => {
        try {
          const dataString = JSON.stringify(payload);
          controller.enqueue(encoder.encode(`event: wasender-event\ndata: ${dataString}\n\n`));
        } catch (e) {
          console.error("[SSE] Failed to encode payload:", e);
        }
      };

      eventBus.on("wasender-event", onWasenderEvent);

      // Keep connection alive with ping every 15 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        eventBus.off("wasender-event", onWasenderEvent);
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Ignored
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
