import { EventEmitter } from "events";
import { WasenderWebhookPayload } from "./types";

// Global EventEmitter instance to survive Next.js hot-reloads during dev
declare global {
  // eslint-disable-next-line no-var
  var __wasender_event_bus: EventEmitter | undefined;
}

export const eventBus: EventEmitter =
  globalThis.__wasender_event_bus || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.__wasender_event_bus = eventBus;
}

// Increase listener limit to handle multiple connected frontend clients
eventBus.setMaxListeners(100);

export function broadcastWebhookEvent(payload: WasenderWebhookPayload) {
  eventBus.emit("wasender-event", payload);
}
