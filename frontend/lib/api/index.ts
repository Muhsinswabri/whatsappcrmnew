/**
 * WA2 API — Unified service layer
 *
 * Re-exports all domain-specific service modules and provides a
 * backward-compatible `api` object that maps old method signatures
 * to the new WA2 API endpoints.
 *
 * Components should import from here:
 *   import { api } from "@/lib/api";
 *   // or for direct access:
 *   import { getChats, sendMessage } from "@/lib/api";
 *
 * WA2 Integration: This file was added for the WA2 API integration.
 */

// Re-export individual service modules
export * from "./client";
export * from "./dashboard";
export * from "./chats";
export * from "./messages";

// Re-export types used by components
export type {
  Contact,
  Message,
  Stats,
  SessionInfo,
  WA2Conversation,
  WA2Message,
  WA2DashboardData,
} from "../types";

// ─── Domain service imports ─────────────────────────────────────────────────────
import { getDashboard } from "./dashboard";
import { getChats, getChat, toggleAiResponse } from "./chats";
import { getMessages, sendMessage } from "./messages";

import type {
  Contact,
  Message,
  Stats,
  SessionInfo,
  WA2Conversation,
  WA2Message,
} from "../types";

// ─── Mapping helpers: WA2 types → existing domain types ─────────────────────────

/** Map a WA2Conversation to the existing Contact interface used by all components */
export function mapConversationToContact(conv: WA2Conversation): Contact {
  return {
    _id: conv._id,
    phone: conv.phone.startsWith("+") ? conv.phone : `+${conv.phone}`,
    name: conv.name || conv.phone,
    last_message_at: conv.updated_at || null,
    unread_count: conv.unread_count || 0,
    automation_status: conv.ai_response ? "ON" : "OFF",
    takeover_by: conv.ai_response ? null : "human",
    last_message_preview: conv.last_message || null,
  };
}

/** Map a WA2Message to the existing Message interface used by components */
export function mapWA2Message(msg: WA2Message): Message {
  return {
    _id: msg._id,
    phone: "", // Phone is known from the conversation context
    direction: msg.direction === "incoming" ? "inbound" : "outbound",
    sender_type:
      msg.direction === "incoming" ? "customer" : "human",
    message_type: msg.media ? "image" : "text",
    content: msg.message || "",
    media_url: msg.media || undefined,
    status:
      msg.status === "received"
        ? "read"
        : msg.status === "sent"
          ? "sent"
          : msg.status === "delivered"
            ? "delivered"
            : msg.status === "failed"
              ? "failed"
              : "sent",
    created_at: msg.timestamp || new Date().toISOString(),
  };
}

// ─── Backward-compatible API object ─────────────────────────────────────────────
//
// This matches the method signatures that existing components (DashboardPage,
// ChatWindow, ContactList, etc.) already call via `api.*`.
//
// Internally everything delegates to the new WA2 service modules above.

export const api = {
  /**
   * Fetch conversations from WA2 API, mapped to the Contact[] shape.
   * Supports optional client-side search filtering.
   */
  getContacts: async (search?: string): Promise<{ contacts: Contact[] }> => {
    try {
      const conversations = await getChats();
      let contacts = conversations.map(mapConversationToContact);

      if (search) {
        const q = search.toLowerCase();
        contacts = contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q)
        );
      }

      return { contacts };
    } catch (e) {
      console.error("[WA2 API] Failed to fetch chats:", e);
      return { contacts: [] };
    }
  },

  /**
   * Fetch message history for a conversation, mapped to Message[].
   * @param conversationId — the MongoDB _id of the conversation
   */
  getMessages: async (
    conversationId: string
  ): Promise<{ messages: Message[] }> => {
    try {
      const wa2Msgs = await getMessages(conversationId);
      const messages = wa2Msgs.map(mapWA2Message);
      return { messages };
    } catch (e) {
      console.error("[WA2 API] Failed to fetch messages:", e);
      return { messages: [] };
    }
  },

  /**
   * Send a text message via WA2 API (which sends via Wasender + persists to MongoDB).
   */
  sendMessage: async (
    phone: string,
    text: string,
    _mediaUrl?: string
  ): Promise<{ ok: boolean; messageId?: string }> => {
    try {
      const result = await sendMessage(phone.replace(/\D/g, ""), text);
      return {
        ok: true,
        messageId: result.message?._id || `msg_${Date.now()}`,
      };
    } catch (e: any) {
      throw new Error(e.message || "Failed to send message");
    }
  },

  /**
   * Toggle AI auto-reply (automation) for a conversation.
   * Maps the old ON/OFF to WA2's boolean ai_response.
   */
  toggleAutomation: async (
    conversationId: string,
    status: "ON" | "OFF"
  ): Promise<{ ok: boolean }> => {
    try {
      await toggleAiResponse(conversationId, status === "ON");
      return { ok: true };
    } catch (e: any) {
      throw new Error(e.message || "Failed to toggle automation");
    }
  },

  /**
   * Fetch dashboard stats from WA2 API, mapped to Stats shape.
   */
  getStats: async (): Promise<Stats> => {
    try {
      const dashboard = await getDashboard();
      return {
        total_contacts: dashboard.totalConversations || 0,
        messages_today: dashboard.totalMessages || 0,
        human_takeovers: 0, // WA2 API doesn't provide this aggregate
        failed_automations: 0,
        unread_messages: dashboard.totalUnread || 0,
      };
    } catch (e) {
      console.error("[WA2 API] Failed to fetch dashboard:", e);
      return {
        total_contacts: 0,
        messages_today: 0,
        human_takeovers: 0,
        failed_automations: 0,
        unread_messages: 0,
      };
    }
  },

  /**
   * Fetch session/connection info from the WA2 dashboard endpoint.
   */
  getSessionInfo: async (): Promise<SessionInfo> => {
    try {
      const dashboard = await getDashboard();
      const conn = dashboard.connection || {};
      const rawStatus = String(
        (conn as any).status || (conn as any).state || "disconnected"
      ).toLowerCase();

      let status: SessionInfo["status"] = "disconnected";
      if (
        ["connected", "open", "authenticated", "ready"].includes(rawStatus)
      ) {
        status = "connected";
      } else if (
        ["connecting", "authenticating", "init"].includes(rawStatus)
      ) {
        status = "connecting";
      } else if (
        ["qr", "qr_ready", "got_qr", "qrcode"].includes(rawStatus)
      ) {
        status = "qr_ready";
      }

      return {
        status,
        qr_code: (conn as any).qrCode || (conn as any).qr || null,
        phone_number:
          (conn as any).phoneNumber ||
          (conn as any).phone_number ||
          (conn as any).id ||
          null,
        name: (conn as any).name || (conn as any).pushName || null,
      };
    } catch (e) {
      console.error("[WA2 API] Failed to fetch session info:", e);
      return { status: "disconnected" };
    }
  },

  /** Get QR code from session info */
  getQRCode: async (): Promise<string | null> => {
    try {
      const session = await api.getSessionInfo();
      return session.qr_code || null;
    } catch {
      return null;
    }
  },

  /** Placeholder — WA2 API manages sessions via Wasender internally */
  connectSession: async () => ({ status: "connecting" }),
  disconnectSession: async () => ({ status: "disconnected" }),
  restartSession: async () => ({ status: "restarting" }),
};
