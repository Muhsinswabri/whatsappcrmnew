/**
 * WA2 API — Chats (Conversations) service
 *
 * Manages conversations stored in MongoDB via the WA2 backend.
 *
 * WA2 Integration: This file was added for the WA2 API integration.
 */

import { wa2Fetch } from "./client";
import type { WA2Conversation } from "../types";

/**
 * GET /chats
 * List all conversations, sorted by most recently updated.
 */
export async function getChats(): Promise<WA2Conversation[]> {
  return wa2Fetch<WA2Conversation[]>("/chats");
}

/**
 * GET /chats/{id}
 * Get a single conversation by its MongoDB _id.
 */
export async function getChat(id: string): Promise<WA2Conversation> {
  return wa2Fetch<WA2Conversation>(`/chats/${encodeURIComponent(id)}`);
}

/**
 * PATCH /chats/{id}
 * Toggle AI auto-reply for a conversation.
 *
 * When ai_response is true, incoming messages trigger the n8n AI-reply flow.
 * When false, messages are saved but no automatic reply is sent.
 */
export async function toggleAiResponse(
  id: string,
  aiResponse: boolean
): Promise<WA2Conversation> {
  return wa2Fetch<WA2Conversation>(`/chats/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ ai_response: aiResponse }),
  });
}
