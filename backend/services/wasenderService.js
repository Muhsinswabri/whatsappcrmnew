const axios = require("axios");
const config = require("../config/env");
const logger = require("../utils/logger");

const client = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  },
  timeout: 15000,
});

class WasenderService {
  /**
   * GET /api/contacts
   * Retrieves all WhatsApp contacts / chats directly from Wasender API.
   * Does NOT store locally.
   */
  async getChats() {
    try {
      const res = await client.get("/contacts");
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.data)) list = res.data.data;
      else if (Array.isArray(res.data?.contacts)) list = res.data.contacts;

      return list.map((c, idx) => {
        const rawJid = c.jid || c.id || "";
        const jidPhone = rawJid.includes("@") ? rawJid.split("@")[0] : "";
        const rawPhone = c.phone || c.phone_number || jidPhone || `contact_${idx}`;
        const digitsOnly = String(rawPhone).replace(/\D/g, "");
        const formattedPhone = digitsOnly ? `+${digitsOnly}` : rawPhone;

        return {
          id: String(c.id || c._id || digitsOnly || `c_${idx}`),
          phone: formattedPhone,
          name: c.name || c.pushName || c.notify || formattedPhone,
          lastMessageAt: c.last_message_at || c.updated_at || null,
          lastMessagePreview: c.last_message_preview || c.lastMessage || null,
          unreadCount: Number(c.unread_count || c.unreadCount || 0),
        };
      });
    } catch (err) {
      logger.error("Failed to fetch chats from Wasender API", err);
      return [];
    }
  }

  /**
   * GET /api/whatsapp-sessions/{sessionId}/message-logs
   * Retrieves historical messages for a specific chat / phone directly from Wasender API.
   * Does NOT store locally.
   */
  async getMessages(phone) {
    try {
      const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
      const sessionId = config.sessionId;

      const params = {
        page: 1,
        per_page: 50,
      };
      if (cleanPhone) {
        params.phone = cleanPhone;
      }

      const res = await client.get(`/whatsapp-sessions/${sessionId}/message-logs`, {
        params,
      });

      let rawLogs = [];
      if (Array.isArray(res.data)) rawLogs = res.data;
      else if (Array.isArray(res.data?.data)) rawLogs = res.data.data;
      else if (Array.isArray(res.data?.data?.data)) rawLogs = res.data.data.data;
      else if (Array.isArray(res.data?.logs)) rawLogs = res.data.logs;
      else if (Array.isArray(res.data?.messages)) rawLogs = res.data.messages;

      return rawLogs
        .map((m, idx) => {
          const fromMe = Boolean(
            m.fromMe ||
            m.key?.fromMe ||
            m.direction === "outbound" ||
            m.sender_type === "human" ||
            m.sender_type === "automation"
          );

          const bodyText =
            m.messageBody ||
            m.body ||
            m.text ||
            m.content ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

          const mediaUrl =
            m.mediaUrl ||
            m.media_url ||
            m.message?.imageMessage?.url ||
            m.message?.videoMessage?.url ||
            m.message?.audioMessage?.url ||
            m.message?.documentMessage?.url;

          let created_at;
          if (m.timestamp) {
            const ts = Number(m.timestamp);
            created_at = new Date(ts > 9999999999 ? ts : ts * 1000).toISOString();
          } else {
            created_at = m.created_at || new Date().toISOString();
          }

          const senderPhone =
            m.key?.cleanedSenderPn ||
            m.key?.cleanedParticipantPn ||
            m.phone ||
            cleanPhone;

          return {
            id: String(m.key?.id || m.id || m._id || `msg_${Date.now()}_${idx}`),
            phone: cleanPhone || senderPhone,
            direction: fromMe ? "outbound" : "inbound",
            senderType: fromMe ? "human" : "customer",
            content: bodyText,
            mediaUrl: mediaUrl || null,
            status: m.status || (fromMe ? "sent" : "read"),
            createdAt: created_at,
          };
        })
        .filter((m) => {
          if (!cleanPhone) return true;
          const msgPhone = m.phone.replace(/\D/g, "");
          return (
            msgPhone === cleanPhone ||
            msgPhone.endsWith(cleanPhone) ||
            cleanPhone.endsWith(msgPhone)
          );
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      logger.error(`Failed to fetch message logs for ${phone}`, err);
      return [];
    }
  }

  /**
   * POST /api/send-message
   * Proxy message send request to Wasender.
   */
  async sendMessage(to, text, mediaUrl) {
    const cleanPhone = to.replace(/\D/g, "");
    let payload = { to: cleanPhone, text };

    if (mediaUrl) {
      if (mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        payload = { to: cleanPhone, imageUrl: mediaUrl, caption: text };
      } else if (mediaUrl.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        payload = { to: cleanPhone, videoUrl: mediaUrl, caption: text };
      } else if (mediaUrl.match(/\.(mp3|ogg|wav|m4a|aac)$/i)) {
        payload = { to: cleanPhone, audioUrl: mediaUrl };
      } else {
        payload = { to: cleanPhone, documentUrl: mediaUrl, fileName: "Attachment" };
      }
    }

    const res = await client.post("/send-message", payload);
    return res.data;
  }

  /**
   * GET /api/status
   * Proxy session status check to Wasender.
   */
  async getSessionStatus() {
    try {
      const res = await client.get("/status");
      const statusRaw = res.data?.status || res.data?.state || "disconnected";
      let status = "disconnected";

      if (["connected", "open", "authenticated", "ready"].includes(String(statusRaw).toLowerCase())) {
        status = "connected";
      } else if (["connecting", "authenticating", "init"].includes(String(statusRaw).toLowerCase())) {
        status = "connecting";
      } else if (["qr", "qr_ready", "got_qr", "qrcode"].includes(String(statusRaw).toLowerCase())) {
        status = "qr_ready";
      }

      let phoneNumber = null;
      let name = null;
      try {
        const userRes = await client.get("/user");
        const userData = userRes.data?.data || userRes.data || {};
        phoneNumber = userData.id || userData.phone || userData.phone_number || null;
        name = userData.name || userData.pushName || null;
      } catch (e) {
        // Ignored
      }

      return {
        status,
        phoneNumber,
        name,
        qrCode: res.data?.qrCode || res.data?.qr || null,
      };
    } catch (err) {
      logger.error("Failed to fetch session status", err);
      return { status: "disconnected" };
    }
  }

  /**
   * GET /api/whatsapp-sessions/{sessionId}/qrcode
   * Proxy QR code lookup.
   */
  async getQRCode() {
    try {
      const sessionId = config.sessionId;
      const res = await client.get(`/whatsapp-sessions/${sessionId}/qrcode`);
      return res.data?.qrCode || res.data?.qr || null;
    } catch (err) {
      try {
        const fallbackRes = await client.get("/qrcode");
        return fallbackRes.data?.qrCode || fallbackRes.data?.qr || null;
      } catch (e) {
        return null;
      }
    }
  }

  /**
   * POST /api/whatsapp-sessions/{sessionId}/connect
   */
  async connectSession() {
    const sessionId = config.sessionId;
    const res = await client.post(`/whatsapp-sessions/${sessionId}/connect`);
    return res.data;
  }

  /**
   * POST /api/whatsapp-sessions/{sessionId}/disconnect
   */
  async disconnectSession() {
    const sessionId = config.sessionId;
    const res = await client.post(`/whatsapp-sessions/${sessionId}/disconnect`);
    return res.data;
  }

  /**
   * POST /api/whatsapp-sessions/{sessionId}/restart
   */
  async restartSession() {
    const sessionId = config.sessionId;
    const res = await client.post(`/whatsapp-sessions/${sessionId}/restart`);
    return res.data;
  }
}

module.exports = new WasenderService();
