import { SessionInfo, SessionStatus, WasenderContact, WasenderMessage } from "@/lib/types";

const getApiKey = () =>
  process.env.NEXT_PUBLIC_WASENDER_API_KEY ||
  process.env.VITE_WASENDER_API_KEY ||
  process.env.WASENDER_API_KEY ||
  "c460f962c1a9134e761f67d379de9b36824423bc5ead27dc7a6484f8f6df0f9c";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_WASENDER_URL ||
  process.env.VITE_WASENDER_URL ||
  "https://wasenderapi.com/api";

export const DEFAULT_SESSION_ID =
  process.env.NEXT_PUBLIC_SESSION_ID || "105975";

/**
 * Robust service to interface with Wasender REST API endpoints using Session API Key.
 * Endpoints reference: https://wasenderapi.com/llms.txt
 */
class WasenderService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isBackendUrl = endpoint.startsWith("/chats") || endpoint.startsWith("/session");
    const baseUrl = isBackendUrl ? "/backend-api" : (process.env.NEXT_PUBLIC_WASENDER_URL || "https://wasenderapi.com/api");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = isBackendUrl ? `${baseUrl}${cleanEndpoint}` : `/wasender-proxy${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    // Only add Authorization header if we are bypassing the proxy and calling Wasender directly
    if (!isBackendUrl) {
      const apiKey = getApiKey();
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `API error (${res.status})`;
      try {
        const body = await res.json();
        errorMsg = body.message || body.error || body.detail || errorMsg;
      } catch (e) {
        // Ignored fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // --- Session Management ---

  /**
   * GET /api/session/status
   * Returns the current status of the WhatsApp session.
   */
  async getSessionStatus(): Promise<SessionInfo> {
    try {
      const res = await this.request<any>("/session/status");
      const data = res.data || {};
      return {
        status: data.status || "disconnected",
        qr_code: data.qrCode || null,
        phone_number: data.phoneNumber || null,
        name: data.name || null,
      };
    } catch (err) {
      console.warn("[Wasender Proxy] Failed to fetch session status:", err);
      return { status: "disconnected" };
    }
  }

  /**
   * GET /api/session/qr
   */
  async getQRCode(): Promise<string | null> {
    try {
      const res = await this.request<any>("/session/qr");
      return res.data?.qrCode || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * POST /api/session/connect
   */
  async connectSession(): Promise<any> {
    try {
      return await this.request("/session/connect", { method: "POST" });
    } catch (e) {
      return { status: "connecting" };
    }
  }

  /**
   * POST /api/session/disconnect
   */
  async disconnectSession(): Promise<any> {
    try {
      return await this.request("/session/disconnect", { method: "POST" });
    } catch (e) {
      return { status: "disconnected" };
    }
  }

  /**
   * POST /api/session/restart
   */
  async restartSession(): Promise<any> {
    try {
      return await this.request("/session/restart", { method: "POST" });
    } catch (e) {
      return { status: "restarting" };
    }
  }

  // --- Contacts ---

  /**
   * GET /api/chats
   * Retrieves a list of all contacts synced with the WhatsApp session.
   */
  async getContacts(): Promise<WasenderContact[]> {
    try {
      const res = await this.request<any>("/chats");
      return res.data || [];
    } catch (err) {
      console.error("[Wasender Proxy] Error fetching contacts:", err);
      return [];
    }
  }

  // --- Message Logs ---

  /**
   * GET /api/chats/:phone/messages
   * Retrieves message logs for a session contact from backend proxy.
   */
  async getMessageLogs(phone?: string, page = 1, perPage = 50): Promise<WasenderMessage[]> {
    try {
      if (!phone) return [];
      const res = await this.request<any>(`/chats/${encodeURIComponent(phone)}/messages`);
      return res.data || [];
    } catch (err) {
      console.error("[Wasender Proxy] Error fetching message logs:", err);
      return [];
    }
  }

  // --- Sending Messages ---

  /**
   * POST /api/chats/:phone/messages
   * Sends a plain text message.
   */
  async sendText(to: string, message: string): Promise<any> {
    return this.request(`/chats/${encodeURIComponent(to)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text: message }),
    });
  }

  /**
   * POST /api/chats/:phone/messages
   * Sends an image message.
   */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<any> {
    return this.request(`/chats/${encodeURIComponent(to)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text: caption, mediaUrl: imageUrl }),
    });
  }

  /**
   * POST /api/chats/:phone/messages
   * Sends a video message.
   */
  async sendVideo(to: string, videoUrl: string, caption?: string): Promise<any> {
    return this.request(`/chats/${encodeURIComponent(to)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text: caption, mediaUrl: videoUrl }),
    });
  }

  /**
   * POST /api/chats/:phone/messages
   * Sends an audio message.
   */
  async sendAudio(to: string, audioUrl: string): Promise<any> {
    return this.request(`/chats/${encodeURIComponent(to)}/messages`, {
      method: "POST",
      body: JSON.stringify({ mediaUrl: audioUrl }),
    });
  }

  /**
   * POST /api/chats/:phone/messages
   * Sends a document message.
   */
  async sendDocument(to: string, documentUrl: string, fileName?: string): Promise<any> {
    return this.request(`/chats/${encodeURIComponent(to)}/messages`, {
      method: "POST",
      body: JSON.stringify({ mediaUrl: documentUrl }),
    });
  }

  /**
   * POST /api/messages/read
   * Marks a specific received WhatsApp message as read (blue ticks).
   */
  async markAsRead(messageId: string): Promise<any> {
    try {
      return await this.request("/messages/read", {
        method: "POST",
        body: JSON.stringify({ messageId }),
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * GET /api/on-whatsapp/{phone_number}
   * Verifies if a phone number is on WhatsApp.
   */
  async checkOnWhatsApp(phone: string): Promise<{ exists: boolean; jid?: string }> {
    try {
      const res = await this.request<any>(`/on-whatsapp/${encodeURIComponent(phone)}`);
      return {
        exists: Boolean(res.exists || res.onWhatsApp || res.data?.exists),
        jid: res.jid || res.data?.jid,
      };
    } catch (err) {
      return { exists: false };
    }
  }
}

export const wasender = new WasenderService();
