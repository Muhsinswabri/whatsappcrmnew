"use client";

import React from "react";

export type ViewName =
  | "dashboard"
  | "chats"
  | "broadcasts"
  | "templates"
  | "settings";

interface SidebarProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  onNewChat?: () => void;
}

const navItems: { view: ViewName; icon: string; label: string }[] = [
  { view: "dashboard", icon: "dashboard", label: "Dashboard" },
  { view: "chats", icon: "chat", label: "Chats" },
  { view: "broadcasts", icon: "campaign", label: "Broadcasts" },
  { view: "templates", icon: "description", label: "Templates" },
  { view: "settings", icon: "settings", label: "Settings" },
];

export function Sidebar({ activeView, onNavigate, onNewChat }: SidebarProps) {
  return (
    <nav className="w-sidebar-width h-screen fixed left-0 top-0 flex flex-col py-lg z-50 bg-black">
      {/* Brand */}
      <div className="px-lg mb-xl">
        <h1 className="text-headline-md font-bold text-primary">Wexo CRM</h1>
        <p className="text-label-md text-on-surface-variant mt-1">
          Management Console
        </p>
      </div>

      {/* New Chat CTA */}
      <div className="px-md mb-lg">
        <button
          onClick={onNewChat}
          className="w-full bg-primary-container text-on-primary py-sm px-md rounded-2xl text-label-md flex items-center justify-center gap-xs hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Chat
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-xs space-y-base">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`
                w-full flex items-center gap-sm px-md py-sm rounded-xl mx-2 transition-all duration-200 text-left
                ${
                  isActive
                    ? "bg-surface-container-highest text-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50"
                }
              `}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="text-label-md">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-xs mt-auto pt-lg space-y-base">
        <a
          href="#"
          className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 transition-all duration-200 px-md py-sm rounded-xl mx-2"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="text-label-md">Help</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-sm text-error hover:bg-error/10 transition-all duration-200 px-md py-sm rounded-xl mx-2 mb-4"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-label-md">Logout</span>
        </a>
      </div>
    </nav>
  );
}
