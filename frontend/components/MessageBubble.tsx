"use client";

import React from "react";
import { Message } from "@/lib/types";

export function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  const label =
    message.sender_type === "automation"
      ? "Automation"
      : message.sender_type === "human"
        ? "You"
        : null;

  const renderStatusIcon = () => {
    if (!isOutbound) return null;

    switch (message.status) {
      case "read":
        return (
          <span
            className="material-symbols-outlined text-[16px] text-sky-400"
            style={{ fontVariationSettings: "'FILL' 1" }}
            title="Read"
          >
            done_all
          </span>
        );
      case "delivered":
        return (
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant/60"
            title="Delivered"
          >
            done_all
          </span>
        );
      case "sent":
        return (
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant/60"
            title="Sent"
          >
            done
          </span>
        );
      case "pending":
        return (
          <span
            className="material-symbols-outlined text-[16px] text-amber-400/80 animate-pulse"
            title="Sending..."
          >
            schedule
          </span>
        );
      case "failed":
        return (
          <span
            className="material-symbols-outlined text-[16px] text-error"
            title="Failed to send"
          >
            error
          </span>
        );
      default:
        return (
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant/60"
            title="Sent"
          >
            done
          </span>
        );
    }
  };

  return (
    <div
      className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[75%] p-4 shadow-sm
          ${
            isOutbound
              ? "bg-primary-container text-on-primary rounded-2xl rounded-tr-sm"
              : "bg-surface-container-highest text-on-surface rounded-2xl rounded-tl-sm"
          }
        `}
      >
        {/* Sender label */}
        {label && (
          <span
            className={`text-[11px] font-medium block mb-1 ${
              isOutbound ? "text-on-primary/70" : "text-primary/70"
            }`}
          >
            {label}
          </span>
        )}

        {/* Media content */}
        {message.message_type === "image" && message.media_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.media_url}
            alt=""
            className="max-w-full rounded-xl mb-2"
          />
        )}
        {message.message_type === "audio" && message.media_url && (
          <audio
            controls
            src={message.media_url}
            className="max-w-[220px] mb-2"
          />
        )}
        {message.message_type === "video" && message.media_url && (
          <video
            controls
            src={message.media_url}
            className="max-w-[240px] rounded-xl mb-2"
          />
        )}
        {message.message_type === "document" && message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-secondary text-sm mb-2 hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">
              description
            </span>
            Document
          </a>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {/* Timestamp + Status */}
        <div
          className={`flex items-center gap-1.5 mt-2 ${
            isOutbound ? "justify-end" : "justify-end"
          }`}
        >
          <span
            className={`text-[11px] font-medium ${
              isOutbound ? "text-on-primary/80" : "text-on-surface-variant"
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {renderStatusIcon()}
        </div>
      </div>
    </div>
  );
}
