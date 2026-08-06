const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_WA2_API_URL || "https://wa2-api.vercel.app/api";

class WA2Service {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getBaseUrl();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

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

  // --- Dashboard ---
  async getDashboard() {
    try {
      const res = await this.request<any>("/dashboard");
      return res.data || {};
    } catch (err) {
      console.error("[WA2 API] Error fetching dashboard:", err);
      return {};
    }
  }

  // --- Chats ---
  async getChats() {
    try {
      const res = await this.request<any>("/chats");
      return res.data || [];
    } catch (err) {
      console.error("[WA2 API] Error fetching chats:", err);
      return [];
    }
  }

  async toggleAutomation(id: string, ai_response: boolean) {
    try {
      const res = await this.request<any>(`/chats/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ai_response }),
      });
      return res.data;
    } catch (err) {
      console.error("[WA2 API] Error toggling automation:", err);
      throw err;
    }
  }

  // --- Messages ---
  async getMessages(id: string) {
    try {
      if (!id) return [];
      const res = await this.request<any>(`/chats/${id}/messages`);
      return res.data || [];
    } catch (err) {
      console.error("[WA2 API] Error fetching message logs:", err);
      return [];
    }
  }

  async sendMessage(phone: string, message: string, mediaUrl?: string) {
    try {
      const payload: any = { phone, message };
      if (mediaUrl) payload.mediaUrl = mediaUrl; // In case the API supports it

      const res = await this.request<any>("/messages/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    } catch (err) {
      console.error("[WA2 API] Error sending message:", err);
      throw err;
    }
  }
}

export const wa2 = new WA2Service();
