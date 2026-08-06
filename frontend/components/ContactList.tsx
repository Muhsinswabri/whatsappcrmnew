"use client";

import React from "react";
import { Contact, Stats } from "@/lib/types";

function timeLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ContactList({
  contacts,
  selectedPhone,
  onSelect,
  search,
  onSearchChange,
  stats,
}: {
  contacts: Contact[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  stats?: Stats | null;
}) {
  return (
    <section className="w-chat-list-width flex-shrink-0 bg-surface-container rounded-3xl flex flex-col h-full z-40 overflow-hidden shadow-lg">
      {/* Search Bar */}
      <div className="p-6 pb-4">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">
            search
          </span>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats..."
            type="text"
            className="w-full bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant border-none rounded-full py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="font-sans text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-md border border-outline-variant/30">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Chat Items List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 chat-scroll">
        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-4">
              chat_bubble_outline
            </span>
            <p className="text-body-md text-on-surface-variant">
              No contacts yet
            </p>
            <p className="text-label-md text-on-surface-variant/70 mt-1">
              Contacts will appear when messages arrive
            </p>
          </div>
        )}

        {contacts.map((c) => {
          const isActive = c.phone === selectedPhone;
          const isHumanMode = c.automation_status === "OFF";

          return (
            <button
              key={c._id}
              onClick={() => onSelect(c.phone)}
              className={`
                w-full p-4 flex items-center gap-3 cursor-pointer rounded-2xl transition-colors text-left
                ${
                  isActive
                    ? "bg-surface-container-highest"
                    : "hover:bg-surface-container-highest/50"
                }
              `}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-lg">
                  {(c.name || c.phone).slice(0, 1).toUpperCase()}
                </div>
                {/* Online indicator */}
                {isActive && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface-container-highest" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-label-md text-on-surface truncate text-sm font-medium">
                    {c.name || c.phone}
                  </h3>
                  <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">
                    {timeLabel(c.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      px-2 py-0.5 rounded text-[10px] font-medium border
                      ${
                        isHumanMode
                          ? "bg-secondary/10 text-secondary border-secondary/20"
                          : "bg-primary/10 text-primary border-primary/20"
                      }
                    `}
                  >
                    {isHumanMode ? "Human" : "Automated"}
                  </span>
                  {c.last_message_preview && (
                    <p className="text-xs text-on-surface-variant truncate">
                      {c.last_message_preview}
                    </p>
                  )}
                </div>
                {/* Unread badge */}
                {c.unread_count > 0 && (
                  <div className="flex justify-end mt-1">
                    <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-on-primary text-[11px] font-semibold flex items-center justify-center px-1">
                      {c.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats Footer */}
      {stats && (
        <div className="p-6 bg-surface-container/50 border-t border-outline-variant/20">
          <div className="flex justify-between text-xs text-on-surface-variant mb-3">
            <span>Contacts</span>
            <span className="font-medium text-on-surface">
              {stats.total_contacts}
            </span>
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>Msgs Today</span>
            <span className="font-medium text-on-surface">
              {stats.messages_today}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
