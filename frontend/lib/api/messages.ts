/**
 * WA2 API — Messages service
 *
 * Retrieves message history and sends outgoing WhatsApp messages.
 *
 * WA2 Integration: This file was added for the WA2 API integration.
 */

import { wa2Fetch } from "./client";
import type { WA2Message } from "../types";

/**
 * GET /chats/{id}/messages
 * Returns message history for a conversation, oldest first.
 */
export async function getMessages(conversationId: string): Promise<WA2Message[]> {
  return wa2Fetch<WA2Message[]>(
    `/chats/${encodeURIComponent(conversationId)}/messages`
  );
}

/** Response shape from POST /messages/send */
export interface SendMessageResult {
  message: WA2Message;
  wasender: Record<string, unknown>;
}

/**
 * POST /messages/send
 * Sends an outgoing WhatsApp message via Wasender.
 * Persists the message and upserts the conversation in MongoDB.
 */
export async function sendMessage(
  phone: string,
  message: string
): Promise<SendMessageResult> {
  return wa2Fetch<SendMessageResult>("/messages/send", {
    method: "POST",
    body: JSON.stringify({ phone, message }),
  });
}
