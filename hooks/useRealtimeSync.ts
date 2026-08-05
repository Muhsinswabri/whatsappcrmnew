import { useEffect } from "react";
import { Contact, Message, WasenderWebhookPayload } from "@/lib/types";
import { saveStoredMessage } from "@/lib/api";

interface UseRealtimeSyncProps {
  activePhone?: string | null;
  onNewMessage?: (msg: Message) => void;
  onMessageUpdate?: (update: { id: string; status: Message["status"] }) => void;
  onContactUpdate?: (contact: Partial<Contact> & { phone: string }) => void;
  onSessionUpdate?: () => void;
}

export function useRealtimeSync({
  activePhone,
  onNewMessage,
  onMessageUpdate,
  onContactUpdate,
  onSessionUpdate,
}: UseRealtimeSyncProps) {
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/sse");

      eventSource.addEventListener("wasender-event", (event: MessageEvent) => {
        try {
          const payload: WasenderWebhookPayload = JSON.parse(event.data);
          handleWebhookEvent(payload);
        } catch (e) {
          console.error("[useRealtimeSync] Error parsing SSE event:", e);
        }
      });

      eventSource.onerror = () => {
        // SSE automatically attempts to reconnect on error
      };
    } catch (err) {
      console.warn("[useRealtimeSync] Could not initialize EventSource:", err);
    }

    function handleWebhookEvent(payload: WasenderWebhookPayload) {
      const eventName = payload.event;
      if (!eventName) return;

      if (eventName.startsWith("session.") || eventName.startsWith("qrcode.")) {
        onSessionUpdate?.();
        return;
      }

      if (eventName === "messages.received" || eventName === "messages.upsert" || eventName === "messages.sent") {
        const msgData = (payload as any)?.data?.messages || (payload as any)?.data?.message;
        if (!msgData) return;

        const key = msgData.key || {};
        const fromMe = Boolean(key.fromMe);
        const senderPn = key.cleanedSenderPn || key.cleanedParticipantPn || (key.remoteJid ? key.remoteJid.replace(/@.*$/, "") : "");
        const content = msgData.messageBody || msgData.text || msgData.body || "";

        if (!senderPn) return;

        const newMsg: Message = {
          _id: key.id || `msg_${Date.now()}`,
          phone: senderPn,
          direction: fromMe ? "outbound" : "inbound",
          sender_type: fromMe ? "human" : "customer",
          message_type: "text",
          content,
          status: fromMe ? "sent" : "read",
          created_at: new Date(payload.timestamp ? payload.timestamp * 1000 : Date.now()).toISOString(),
        };

        // Persist message locally
        saveStoredMessage(newMsg);

        if (activePhone && (senderPn === activePhone || senderPn.includes(activePhone) || activePhone.includes(senderPn))) {
          onNewMessage?.(newMsg);
        }

        onContactUpdate?.({
          phone: senderPn,
          last_message_at: newMsg.created_at,
          last_message_preview: content,
          unread_count: fromMe ? 0 : 1,
        });
      }

      if (eventName === "messages.update") {
        const updates = (payload as any)?.data?.updates || [];
        for (const item of updates) {
          if (item.key?.id && item.update?.status) {
            const rawStatus = String(item.update.status).toLowerCase();
            let status: Message["status"] = "sent";
            if (rawStatus.includes("read")) status = "read";
            else if (rawStatus.includes("delivered")) status = "delivered";
            else if (rawStatus.includes("error") || rawStatus.includes("failed")) status = "failed";

            onMessageUpdate?.({ id: item.key.id, status });
          }
        }
      }

      if (eventName === "contacts.upsert" || eventName === "contacts.update") {
        const contacts = (payload as any)?.data?.contacts || [];
        for (const c of contacts) {
          const phone = c.phone || c.phone_number || (c.jid ? c.jid.replace(/@.*$/, "") : null);
          if (phone) {
            onContactUpdate?.({
              phone,
              name: c.name || c.pushName || c.notify || phone,
            });
          }
        }
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [activePhone, onNewMessage, onMessageUpdate, onContactUpdate, onSessionUpdate]);
}
