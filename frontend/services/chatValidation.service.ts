import { WA2Conversation } from "@/lib/types";

interface ValidationResult {
  valid: boolean;
  chat?: WA2Conversation;
  reason?: string;
}

interface CacheEntry {
  result: ValidationResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function checkChatId(chatId: string): Promise<ValidationResult> {
  if (cache.has(chatId)) {
    const entry = cache.get(chatId)!;
    if (Date.now() < entry.expiresAt) {
      return entry.result;
    }
    cache.delete(chatId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_WA2_API_URL || "https://wa2-api.vercel.app/api";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 401) {
      return { valid: false, reason: "Unauthorized" };
    }

    if (res.status === 404) {
      const result = { valid: false, reason: "Invalid Chat ID" };
      cache.set(chatId, { result, expiresAt: Date.now() + CACHE_TTL });
      return result;
    }

    if (res.status === 500) {
      return { valid: false, reason: "Server Error" };
    }

    if (!res.ok) {
      return { valid: false, reason: "API Error" };
    }

    const data = await res.json();
    if (data.success && data.data) {
      const result = { valid: true, chat: data.data };
      cache.set(chatId, { result, expiresAt: Date.now() + CACHE_TTL });
      return result;
    }

    return { valid: false, reason: "Invalid format" };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { valid: false, reason: "Timeout" };
    }
    return { valid: false, reason: "Network Error" };
  }
}
