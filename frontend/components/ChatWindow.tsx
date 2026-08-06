"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Contact, Message, SessionInfo } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";
import { MessageBubble } from "./MessageBubble";
import { SessionStatus } from "./SessionStatus";

/**
 * WA2 Integration:
 * - Messages load via GET /chats/{_id}/messages using conversation _id
 * - Send uses POST /messages/send with { phone, message }
 * - Toggle automation uses PATCH /chats/{_id} with { ai_response }
 * - AI auto-reply label reflects WA2's ai_response field
 */
export function ChatWindow({
  contact,
  onContactUpdated,
  sessionInfo,
  onRefreshSession,
}: {
  contact: Contact | null;
  onContactUpdated: () => void;
  sessionInfo?: SessionInfo | null;
  onRefreshSession?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevIdRef = useRef<string | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [isChatValid, setIsChatValid] = useState(true);

  // WA2 Integration: load messages by conversation _id
  const loadMessages = useCallback(async () => {
    if (!contact) return;
    try {
      const { messages: fetchedMsgs } = await api.getMessages(contact._id);
      setMessages(fetchedMsgs);
    } catch (e) {
      console.error("[ChatWindow] Failed to load messages:", e);
    }
  }, [contact?._id]);

  const validateChat = useCallback(async () => {
    if (!contact) return false;
    try {
      const res = await fetch(`/api/chat/validate/${encodeURIComponent(contact._id)}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return false;
      }
      const data = await res.json();
      setIsChatValid(data.valid);
      return data.valid;
    } catch (e) {
      console.error("Chat validation error", e);
      setIsChatValid(false);
      return false;
    }
  }, [contact]);

  usePolling(loadMessages, 4000, !!contact && isChatValid && !isValidating);

  useEffect(() => {
    // WA2 Integration: track by _id instead of phone
    if (contact?._id !== prevIdRef.current) {
      prevIdRef.current = contact?._id || null;
      setMessages([]);
      setIsChatValid(true);
      if (contact) {
        setLoadingMessages(true);
        setIsValidating(true);
        validateChat().then((valid) => {
          setIsValidating(false);
          if (valid) {
            loadMessages().finally(() => setLoadingMessages(false));
          } else {
            setLoadingMessages(false);
          }
        });
      }
    }
  }, [contact?._id, loadMessages, validateChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!contact || (!text.trim() && !mediaUrl.trim()) || !isChatValid) return;

    const trimmedText = text.trim();
    const trimmedMedia = mediaUrl.trim();

    // Optimistic UI addition
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      _id: tempId,
      phone: contact.phone,
      direction: "outbound",
      sender_type: "human",
      message_type: trimmedMedia ? "image" : "text",
      content: trimmedText,
      media_url: trimmedMedia || undefined,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setMediaUrl("");
    setShowMediaInput(false);
    setSending(true);

    try {
      // WA2 Integration: send via POST /messages/send with { phone, message }
      const res = await api.sendMessage(contact.phone, trimmedText, trimmedMedia || undefined);
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId
              ? { ...m, _id: res.messageId || tempId, status: "sent" }
              : m
          )
        );
      }
      await loadMessages();
      onContactUpdated();
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? { ...m, status: "failed" } : m
        )
      );
      alert(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  // WA2 Integration: toggle uses PATCH /chats/{_id} with { ai_response }
  async function handleToggle() {
    if (!contact) return;
    setToggling(true);
    try {
      const nextStatus = contact.automation_status === "OFF" ? "ON" : "OFF";
      await api.toggleAutomation(contact._id, nextStatus);
      onContactUpdated();
    } catch (e: any) {
      alert(e.message || "Failed to toggle automation");
    } finally {
      setToggling(false);
    }
  }

  if (!contact) {
    return (
      <section className="flex-1 flex flex-col h-full bg-surface-container rounded-3xl relative z-30 overflow-hidden shadow-lg items-center justify-center text-on-surface-variant gap-3">
        <span className="material-symbols-outlined text-[48px] text-primary/40">
          chat
        </span>
        <span className="text-body-lg">Select a conversation to view messages</span>
      </section>
    );
  }

  const isOff = contact.automation_status === "OFF";

  return (
    <section className="flex-1 flex flex-col h-full bg-surface-container rounded-3xl relative z-30 overflow-hidden shadow-lg">
      {/* Top App Bar (Header) */}
      <header className="h-[80px] flex items-center justify-between px-8 bg-surface-container-highest/30 z-20">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-xl shadow-sm">
            {(contact.name || contact.phone).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-headline-sm font-semibold text-on-surface">
              {contact.name || contact.phone}
            </h2>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
              <span>{contact.phone}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-primary font-medium">
                {sessionInfo?.status === "connected" ? "Online" : "Session Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 relative">
            <SessionStatus
              sessionInfo={sessionInfo || null}
              onRefresh={onRefreshSession || (() => {})}
            />
            <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center gap-3">
              {/* WA2 Integration: ai_response true → Automated, false → Human Takeover */}
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  isOff
                    ? "bg-secondary/10 text-secondary border-secondary/20"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                {isOff ? "Human Takeover" : "AI Auto-Reply"}
              </span>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className="bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-label-md font-bold hover:bg-primary transition-colors shadow-sm disabled:opacity-50"
              >
                {toggling ? "..." : isOff ? "Enable AI" : "Take Over"}
              </button>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant/50 transition-colors ml-1">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-24 py-8 chat-scroll flex flex-col gap-[18px]">
        {/* Date Divider */}
        <div className="flex justify-center my-2">
          <span className="bg-surface-container-highest text-on-surface-variant text-xs px-4 py-1.5 rounded-full font-medium">
            Today
          </span>
        </div>

        {/* System Message */}
        <div className="flex justify-center mb-4">
          <p className="text-xs text-on-surface-variant/70 italic text-center max-w-md bg-surface-container-highest/50 px-4 py-2 rounded-xl">
            {isOff
              ? "Human takeover mode active. AI auto-reply is paused for this conversation."
              : "AI auto-reply is active. The AI assistant is handling this conversation. Click 'Take Over' to intervene."}
          </p>
        </div>

        {/* Messages */}
        {loadingMessages || isValidating ? (
          <div className="text-center text-on-surface-variant text-sm mt-8">
            Loading messages...
          </div>
        ) : !isChatValid ? (
          <div className="flex flex-col items-center justify-center text-center mt-8 gap-4">
            <div className="text-error font-semibold">Chat not available</div>
            <button 
              onClick={() => {
                setIsValidating(true);
                validateChat().then(valid => {
                  setIsValidating(false);
                  if (valid) {
                    setLoadingMessages(true);
                    loadMessages().finally(() => setLoadingMessages(false));
                  }
                });
              }}
              className="bg-primary-container text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary transition-colors"
            >
              Reconnect
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-on-surface-variant text-sm mt-8">
            No message history yet. Send a message to start chatting!
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m._id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer (Bottom) */}
      <div className="m-6 mt-2 relative z-20">
        {showMediaInput && (
          <div className="mb-2">
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Media URL (image, audio, video, document)"
              className="w-full bg-surface-container-highest border border-outline-variant/40 rounded-xl px-4 py-2 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        )}
        <div className="flex items-center gap-3 bg-surface-container-highest rounded-[24px] p-3 shadow-md focus-within:ring-2 focus-within:ring-primary/30 transition-all">
          <button
            onClick={() => setShowMediaInput((v) => !v)}
            disabled={!isChatValid}
            className="text-on-surface-variant hover:text-primary p-2.5 rounded-full hover:bg-surface/50 transition-colors flex-shrink-0 disabled:opacity-50"
            title="Attach media"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!isChatValid}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent border-none text-on-surface placeholder:text-on-surface-variant text-[15px] focus:outline-none focus:ring-0 py-2 disabled:opacity-50"
            placeholder={isChatValid ? "Type a message..." : "Chat unavailable"}
            type="text"
          />
          <button className="text-on-surface-variant hover:text-primary p-2.5 rounded-full hover:bg-surface/50 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">sentiment_satisfied</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary p-2.5 rounded-full hover:bg-surface/50 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !isChatValid}
            className="bg-primary-container text-on-primary p-3 rounded-[16px] hover:bg-primary transition-colors flex-shrink-0 shadow-sm flex items-center justify-center ml-1 disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
