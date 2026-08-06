import { wa2 } from "../services/wa2";
import { Contact, Message, Stats, SessionInfo } from "./types";

export type { Contact, Message, Stats, SessionInfo };

export const api = {
  getContacts: async (search?: string): Promise<{ contacts: Contact[] }> => {
    try {
      const rawChats = await wa2.getChats();

      let contacts: Contact[] = rawChats.map((c: any) => ({
        _id: String(c._id),
        phone: String(c.phone),
        name: c.name || String(c.phone),
        last_message_at: c.updated_at || null,
        unread_count: Number(c.unread_count || 0),
        automation_status: c.ai_response ? "ON" : "OFF",
        takeover_by: c.ai_response ? null : "human",
        last_message_preview: c.last_message || null,
      }));

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

  getMessages: async (id: string): Promise<{ messages: Message[] }> => {
    try {
      const rawMessages = await wa2.getMessages(id);

      const messages: Message[] = rawMessages.map((m: any) => ({
        _id: String(m._id),
        phone: "", // we don't strictly need phone here since it's grouped by contact._id in the UI
        direction: m.direction === "outgoing" ? "outbound" : "inbound",
        sender_type: m.direction === "outgoing" ? "human" : "customer",
        message_type: m.media ? "image" : "text", // simplify media type
        content: m.message || "",
        media_url: m.media || undefined,
        status: m.status || "sent",
        created_at: m.timestamp,
      }));

      messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return { messages };
    } catch (e) {
      console.error("[API] Failed to fetch messages:", e);
      return { messages: [] };
    }
  },

  sendMessage: async (
    phone: string,
    text: string,
    mediaUrl?: string
  ): Promise<{ ok: boolean; messageId?: string }> => {
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Calls POST /messages/send
    await wa2.sendMessage(cleanPhone, text, mediaUrl);

    // Note: Since WA2 API returns success immediately, and doesn't return the message ID
    // directly in a standard format (it returns a pass-through response from Wasender),
    // we'll just return a generated ok response. The UI will reload messages.
    return { ok: true, messageId: `msg_${Date.now()}` };
  },

  toggleAutomation: async (id: string, status: "ON" | "OFF") => {
    await wa2.toggleAutomation(id, status === "ON");
    return { ok: true, id, status };
  },

  getStats: async (): Promise<Stats> => {
    try {
      const dashboard = await wa2.getDashboard();
      // Calculate human takeovers
      const contactsRes = await api.getContacts();
      const takeovers = contactsRes.contacts.filter((c) => c.automation_status === "OFF").length;

      return {
        total_contacts: dashboard.totalConversations || contactsRes.contacts.length,
        messages_today: dashboard.totalMessages || 0, 
        human_takeovers: takeovers,
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
    try {
      const dashboard = await wa2.getDashboard();
      const status = dashboard.connection?.status || "disconnected";
      
      let mappedStatus: "connected" | "connecting" | "disconnected" | "qr_ready" = "disconnected";
      if (["connected", "open", "authenticated", "ready"].includes(String(status).toLowerCase())) {
        mappedStatus = "connected";
      } else if (["connecting", "authenticating", "init"].includes(String(status).toLowerCase())) {
        mappedStatus = "connecting";
      } else if (["qr", "qr_ready", "got_qr", "qrcode"].includes(String(status).toLowerCase())) {
        mappedStatus = "qr_ready";
      }

      return {
        status: mappedStatus,
        phone_number: dashboard.connection?.phoneNumber || null,
        name: dashboard.connection?.name || null,
        qr_code: dashboard.connection?.qrCode || null,
      };
    } catch (e) {
      return { status: "disconnected" };
    }
  },

  // These are mocked because the WA2 API handles session state internally.
  getQRCode: async (): Promise<string | null> => {
    const session = await api.getSessionInfo();
    return session.qr_code || null;
  },

  connectSession: async () => {
    // Mocked: UI expects this to resolve
    return { status: "connecting" };
  },

  disconnectSession: async () => {
    // Mocked: UI expects this to resolve
    return { status: "disconnected" };
  },

  restartSession: async () => {
    // Mocked: UI expects this to resolve
    return { status: "restarting" };
  },
};
