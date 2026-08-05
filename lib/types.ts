// ─── Core domain types shared across services, hooks, and components ───────────

export type AutomationStatus = "ON" | "OFF";
export type Direction = "inbound" | "outbound";
export type SenderType = "customer" | "automation" | "human";
export type MessageType = "text" | "image" | "video" | "audio" | "document" | "location" | "sticker" | "contact";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";
export type SessionStatus = "connected" | "connecting" | "disconnected" | "qr_ready" | "unknown";

export interface Contact {
  _id: string;
  phone: string;
  name: string;
  last_message_at: string | null;
  unread_count: number;
  automation_status: AutomationStatus;
  takeover_by?: string | null;
  /** Last message preview text */
  last_message_preview?: string | null;
}

export interface Message {
  _id: string;
  phone: string;
  direction: Direction;
  sender_type: SenderType;
  message_type: MessageType;
  content: string;
  media_url?: string;
  status: MessageStatus;
  created_at: string;
}

export interface Stats {
  total_contacts: number;
  messages_today: number;
  human_takeovers: number;
  failed_automations: number;
}

export interface SessionInfo {
  status: SessionStatus;
  qr_code?: string | null;
  phone_number?: string | null;
  name?: string | null;
}

// ─── Wasender API response shapes ────────────────────────────────────────────

export interface WasenderContact {
  id?: string;
  phone?: string;
  phone_number?: string;
  jid?: string;
  name?: string;
  pushName?: string;
  notify?: string;
}

export interface WasenderMessageKey {
  id: string;
  fromMe: boolean;
  remoteJid: string;
  cleanedSenderPn?: string;
  cleanedParticipantPn?: string;
}

export interface WasenderMessage {
  id?: string;
  key?: WasenderMessageKey;
  messageBody?: string;
  body?: string;
  text?: string;
  content?: string;
  from?: string;
  to?: string;
  phone?: string;
  type?: string;
  message_type?: string;
  fromMe?: boolean;
  direction?: string;
  status?: string;
  timestamp?: number | string;
  created_at?: string;
  mediaUrl?: string;
  media_url?: string;
  message?: {
    imageMessage?: { url?: string; mimetype?: string };
    videoMessage?: { url?: string; mimetype?: string };
    audioMessage?: { url?: string; mimetype?: string };
    documentMessage?: { url?: string; fileName?: string; mimetype?: string };
  };
}

export interface WasenderSessionStatus {
  status?: string;
  state?: string;
  qrCode?: string;
  qr?: string;
  phone_number?: string;
  name?: string;
}

// ─── Webhook event payloads ───────────────────────────────────────────────────

export type WebhookEventType =
  | "messages.received"
  | "messages.upsert"
  | "messages.sent"
  | "messages.update"
  | "chats.upsert"
  | "chats.update"
  | "chats.delete"
  | "contacts.upsert"
  | "contacts.update"
  | "session.status"
  | "qrcode.updated"
  | string;

export interface WebhookMessagePayload {
  event: "messages.received" | "messages.upsert" | "messages.sent";
  timestamp: number;
  data: {
    messages: {
      key: WasenderMessageKey;
      messageBody?: string;
      message?: Record<string, unknown>;
    };
  };
}

export interface WebhookMessageUpdatePayload {
  event: "messages.update";
  timestamp: number;
  data: {
    updates: Array<{
      key: WasenderMessageKey;
      update: { status?: string };
    }>;
  };
}

export interface WebhookChatPayload {
  event: "chats.upsert" | "chats.update" | "chats.delete";
  timestamp: number;
  data: {
    chats: Array<{
      id: string;
      name?: string;
      unreadCount?: number;
      lastMessage?: string;
      timestamp?: number;
    }>;
  };
}

export interface WebhookContactPayload {
  event: "contacts.upsert" | "contacts.update";
  timestamp: number;
  data: {
    contacts: WasenderContact[];
  };
}

export interface WebhookSessionPayload {
  event: "session.status";
  timestamp: number;
  data: {
    status?: string;
    state?: string;
    qrCode?: string;
  };
}

export interface WebhookQRPayload {
  event: "qrcode.updated";
  timestamp: number;
  data: {
    qrCode?: string;
    qr?: string;
  };
}

export type WasenderWebhookPayload =
  | WebhookMessagePayload
  | WebhookMessageUpdatePayload
  | WebhookChatPayload
  | WebhookContactPayload
  | WebhookSessionPayload
  | WebhookQRPayload
  | { event: string; timestamp: number; data: unknown };
