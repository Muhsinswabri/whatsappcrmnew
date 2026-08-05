import { wasender } from "../services/wasender";
import { Contact, Message, Stats, SessionInfo } from "./types";

export type { Contact, Message, Stats, SessionInfo };

// ─── Local persistent storage helpers ─────────────────────────────────────────

const getStoredMessages = (cleanPhone: string): Message[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = `wasender_chat_${cleanPhone}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredMessage = (msg: Message) => {
  if (typeof window === "undefined") return;
  try {
    const cleanPhone = msg.phone.replace(/\D/g, "");
    if (!cleanPhone) return;
    const key = `wasender_chat_${cleanPhone}`;
    const existing = getStoredMessages(cleanPhone);
    const existingIdx = existing.findIndex((m) => m._id === msg._id);

    let updated: Message[];
    if (existingIdx >= 0) {
      updated = [...existing];
      updated[existingIdx] = { ...updated[existingIdx], ...msg };
    } else {
      updated = [...existing, msg];
    }
    // Keep only last 200 messages per contact to avoid localStorage bloat
    if (updated.length > 200) updated = updated.slice(-200);
    localStorage.setItem(key, JSON.stringify(updated));

    // Also update contact metadata store
    const metaKey = `wasender_contact_meta_${cleanPhone}`;
    const meta = {
      last_message_at: msg.created_at,
      last_message_preview: msg.content || (msg.media_url ? "📎 Attachment" : ""),
    };
    localStorage.setItem(metaKey, JSON.stringify(meta));
  } catch (e) {
    // Ignored
  }
};

/** Local automation status override (Wasender API doesn't manage automation) */
const getAutomationStatus = (cleanPhone: string): "ON" | "OFF" => {
  if (typeof window === "undefined") return "ON";
  try {
    const key = `wasender_automation_${cleanPhone}`;
    const val = localStorage.getItem(key);
    return val === "OFF" ? "OFF" : "ON";
  } catch {
    return "ON";
  }
};

const setAutomationStatus = (cleanPhone: string, status: "ON" | "OFF") => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`wasender_automation_${cleanPhone}`, status);
  } catch {
    // Ignored
  }
};

// ─── API methods ───────────────────────────────────────────────────────────────

export const api = {
  getContacts: async (search?: string): Promise<{ contacts: Contact[] }> => {
    try {
      const rawContacts = await wasender.getContacts();

      let contacts: Contact[] = rawContacts.map((c: any, index: number) => {
        // Normalize phone: prefer JID-derived phone, then direct phone field
        const rawJid = c.jid || c.id || "";
        const jidPhone = rawJid.includes("@") ? rawJid.split("@")[0] : "";
        const rawPhone =
          c.phone ||
          c.phone_number ||
          jidPhone ||
          `contact_${index}`;

        // Strip to digits only, then re-prefix with +
        const digitsOnly = String(rawPhone).replace(/\D/g, "");
        const formattedPhone = digitsOnly ? `+${digitsOnly}` : rawPhone;

        // Check local metadata store for latest activity
        let lastMsgAt = c.last_message_at || c.updated_at || null;
        let lastMsgPreview = c.last_message_preview || c.lastMessage || null;

        if (typeof window !== "undefined") {
          try {
            const metaRaw = localStorage.getItem(`wasender_contact_meta_${digitsOnly}`);
            if (metaRaw) {
              const meta = JSON.parse(metaRaw);
              if (meta.last_message_at) lastMsgAt = meta.last_message_at;
              if (meta.last_message_preview) lastMsgPreview = meta.last_message_preview;
            }
          } catch (e) {
            // Ignored
          }
        }

        const autoStatus = getAutomationStatus(digitsOnly);

        return {
          _id: String(c.id || c._id || digitsOnly || `c_${index}`),
          phone: formattedPhone,
          name: c.name || c.pushName || c.notify || formattedPhone,
          last_message_at: lastMsgAt,
          unread_count: Number(c.unread_count || c.unreadCount || 0),
          automation_status: autoStatus,
          takeover_by: autoStatus === "OFF" ? "human" : null,
          last_message_preview: lastMsgPreview,
        };
      });

      if (search) {
        const query = search.toLowerCase();
        contacts = contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone.toLowerCase().includes(query)
        );
      }

      // Sort contacts: contacts with active messages appear first
      contacts.sort((a, b) => {
        if (a.last_message_at && b.last_message_at) {
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        }
        if (a.last_message_at) return -1;
        if (b.last_message_at) return 1;
        return a.name.localeCompare(b.name);
      });

      return { contacts };
    } catch (e) {
      console.error("[API] Failed to fetch contacts:", e);
      return { contacts: [] };
    }
  },

  getMessages: async (phone: string): Promise<{ messages: Message[] }> => {
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const stored = getStoredMessages(cleanPhone);

      // Fetch remote logs via correct endpoint
      const rawLogs = await wasender.getMessageLogs(cleanPhone);

      // Parse each raw log entry into a Message
      const remoteMessages: Message[] = rawLogs
        .map((m: any, index: number) => {
          // Determine direction
          const fromMe = Boolean(
            m.fromMe ||
            m.key?.fromMe ||
            m.direction === "outbound" ||
            m.sender_type === "human" ||
            m.sender_type === "automation"
          );

          // Extract text content — API uses messageBody as unified field
          const bodyText =
            m.messageBody ||
            m.body ||
            m.text ||
            m.content ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

          // Parse status
          let rawStatus = String(m.status || (fromMe ? "sent" : "read")).toLowerCase();
          let status: Message["status"] = "sent";
          if (rawStatus.includes("read")) status = "read";
          else if (rawStatus.includes("deliver")) status = "delivered";
          else if (rawStatus.includes("pending") || rawStatus.includes("pending")) status = "pending";
          else if (rawStatus.includes("fail") || rawStatus.includes("error")) status = "failed";

          // Media URL
          const mediaUrl = m.mediaUrl || m.media_url ||
            m.message?.imageMessage?.url ||
            m.message?.videoMessage?.url ||
            m.message?.audioMessage?.url ||
            m.message?.documentMessage?.url;

          // Determine message type
          let message_type: Message["message_type"] = "text";
          if (m.type || m.message_type) {
            message_type = (m.type || m.message_type) as Message["message_type"];
          } else if (m.message?.imageMessage) {
            message_type = "image";
          } else if (m.message?.videoMessage) {
            message_type = "video";
          } else if (m.message?.audioMessage) {
            message_type = "audio";
          } else if (m.message?.documentMessage) {
            message_type = "document";
          } else if (mediaUrl) {
            message_type = "image";
          }

          // Phone/sender identification
          // key.cleanedSenderPn is the phone in private chats
          // key.cleanedParticipantPn is the phone in group chats
          const senderPhone =
            m.key?.cleanedSenderPn ||
            m.key?.cleanedParticipantPn ||
            m.phone ||
            cleanPhone;

          // Timestamp: Wasender sends Unix seconds
          let created_at: string;
          if (m.timestamp) {
            const ts = Number(m.timestamp);
            // if ts > 9999999999 it's already ms; if < it's seconds
            created_at = new Date(ts > 9_999_999_999 ? ts : ts * 1000).toISOString();
          } else {
            created_at = m.created_at || new Date().toISOString();
          }

          const msgId = String(
            m.key?.id || m.id || m._id || `remote_${Date.now()}_${index}`
          );

          return {
            _id: msgId,
            phone: cleanPhone || senderPhone,
            direction: fromMe ? "outbound" : "inbound",
            sender_type: fromMe ? "human" : "customer",
            message_type,
            content: bodyText,
            media_url: mediaUrl,
            status,
            created_at,
          } as Message;
        })
        .filter((m) => {
          // Only include messages that are relevant to this phone contact
          if (!cleanPhone) return true;
          const msgPhone = m.phone.replace(/\D/g, "");
          return msgPhone === cleanPhone || msgPhone.endsWith(cleanPhone) || cleanPhone.endsWith(msgPhone);
        });

      // Merge stored local messages and remote messages (deduplicated by _id)
      const map = new Map<string, Message>();
      for (const m of stored) {
        map.set(m._id, m);
      }
      for (const m of remoteMessages) {
        // Remote message wins over stored for status updates
        map.set(m._id, m);
        // Also persist to local store for offline access
        saveStoredMessage(m);
      }

      const merged = Array.from(map.values());
      merged.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return { messages: merged };
    } catch (e) {
      console.error("[API] Failed to fetch messages:", e);
      const stored = getStoredMessages(phone.replace(/\D/g, ""));
      return { messages: stored };
    }
  },

  sendMessage: async (
    phone: string,
    text: string,
    mediaUrl?: string
  ): Promise<{ ok: boolean; messageId?: string }> => {
    const cleanPhone = phone.replace(/\D/g, "");
    let res: any;

    if (mediaUrl) {
      if (mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        res = await wasender.sendImage(cleanPhone, mediaUrl, text);
      } else if (mediaUrl.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        res = await wasender.sendVideo(cleanPhone, mediaUrl, text);
      } else if (mediaUrl.match(/\.(mp3|ogg|wav|m4a|aac)$/i)) {
        res = await wasender.sendAudio(cleanPhone, mediaUrl);
      } else {
        res = await wasender.sendDocument(cleanPhone, mediaUrl, "Attachment");
      }
    } else {
      res = await wasender.sendText(cleanPhone, text);
    }

    const messageId =
      res?.data?.key?.id ||
      res?.key?.id ||
      res?.id ||
      res?.data?.id ||
      `msg_${Date.now()}`;

    // Persist outbound message locally
    const outboundMsg: Message = {
      _id: messageId,
      phone: cleanPhone,
      direction: "outbound",
      sender_type: "human",
      message_type: mediaUrl ? "image" : "text",
      content: text,
      media_url: mediaUrl,
      status: "sent",
      created_at: new Date().toISOString(),
    };
    saveStoredMessage(outboundMsg);

    return { ok: true, messageId };
  },

  /**
   * Toggle automation status — stored locally since Wasender API doesn't manage this.
   * When OFF: the chat is in "human takeover" mode.
   * When ON: the chat is in "automated" mode.
   */
  toggleAutomation: async (phone: string, status: "ON" | "OFF") => {
    const cleanPhone = phone.replace(/\D/g, "");
    setAutomationStatus(cleanPhone, status);
    return { ok: true as const, phone, status };
  },

  getStats: async (): Promise<Stats> => {
    try {
      const contactsRes = await api.getContacts();
      const contacts = contactsRes.contacts || [];
      const takovers = contacts.filter((c) => c.automation_status === "OFF").length;

      return {
        total_contacts: contacts.length,
        messages_today: 0, // Wasender API doesn't provide this metric
        human_takeovers: takovers,
        failed_automations: 0,
      };
    } catch (e) {
      return {
        total_contacts: 0,
        messages_today: 0,
        human_takeovers: 0,
        failed_automations: 0,
      };
    }
  },

  getSessionInfo: async (): Promise<SessionInfo> => {
    return wasender.getSessionStatus();
  },

  getQRCode: async (): Promise<string | null> => {
    return wasender.getQRCode();
  },

  connectSession: async () => {
    return wasender.connectSession();
  },

  disconnectSession: async () => {
    return wasender.disconnectSession();
  },

  restartSession: async () => {
    return wasender.restartSession();
  },
};
