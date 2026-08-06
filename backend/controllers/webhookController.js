const logger = require("../utils/logger");
const EventEmitter = require("events");

// Event emitter to broadcast webhooks to any attached listeners (SSE / SSE bridge)
const webhookEvents = new EventEmitter();
webhookEvents.setMaxListeners(100);

const SUPPORTED_EVENTS = new Set([
  "messages.received",
  "messages.upsert",
  "message.status",
  "message-receipt.update",
  "session.status",
  "qrcode.updated",
]);

/**
 * POST /webhook/wasender
 * Receives Wasender webhooks.
 * Returns 200 OK immediately, then processes asynchronously.
 */
const handleWebhook = (req, res) => {
  // 1. Respond with 200 immediately
  res.status(200).json({
    status: "received",
    timestamp: Date.now(),
  });

  // 2. Process asynchronously
  setImmediate(() => {
    try {
      const payload = req.body;
      const eventName = payload?.event;

      if (!eventName) {
        logger.log("Received webhook without event name, ignoring.");
        return;
      }

      logger.log(`Webhook received: [${eventName}]`);

      // Check if supported event
      if (!SUPPORTED_EVENTS.has(eventName)) {
        logger.log(`Ignoring unsupported event: ${eventName}`);
        return;
      }

      // Process supported events & emit to internal event bus
      webhookEvents.emit("wasender-event", payload);
    } catch (err) {
      logger.error("Async webhook processing error", err);
    }
  });
};

module.exports = {
  handleWebhook,
  webhookEvents,
};
