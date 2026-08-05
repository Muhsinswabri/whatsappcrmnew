"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Contact, Stats, SessionInfo } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Sidebar, ViewName } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { ContactList } from "@/components/ContactList";
import { ChatWindow } from "@/components/ChatWindow";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ViewName>("chats");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    const { contacts: fetchedContacts } = await api.getContacts(search || undefined);
    setContacts(fetchedContacts);
  }, [search]);

  const loadStats = useCallback(async () => {
    const fetchedStats = await api.getStats();
    setStats(fetchedStats);
  }, []);

  const loadSessionInfo = useCallback(async () => {
    const info = await api.getSessionInfo();
    setSessionInfo(info);
  }, []);

  useEffect(() => {
    loadContacts();
    loadStats();
    loadSessionInfo();
  }, [loadContacts, loadStats, loadSessionInfo]);

  usePolling(loadContacts, 8000, true);
  usePolling(loadStats, 15000, true);
  usePolling(loadSessionInfo, 10000, true);

  // Real-time SSE Webhook Sync
  useRealtimeSync({
    activePhone: selectedPhone,
    onContactUpdate: (update) => {
      setContacts((prev) => {
        const index = prev.findIndex(
          (c) => c.phone === update.phone || c.phone.includes(update.phone) || update.phone.includes(c.phone)
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...update,
            unread_count: (updated[index].unread_count || 0) + (update.unread_count || 0),
          };
          return updated;
        } else {
          const newContact: Contact = {
            _id: `c_${Date.now()}`,
            phone: update.phone,
            name: update.name || update.phone,
            last_message_at: update.last_message_at || new Date().toISOString(),
            unread_count: update.unread_count || 1,
            automation_status: "ON",
            last_message_preview: update.last_message_preview || null,
          };
          return [newContact, ...prev];
        }
      });
    },
    onSessionUpdate: () => {
      loadSessionInfo();
    },
  });

  const selectedContact = contacts.find((c) => c.phone === selectedPhone) || null;

  const handleNewChat = () => {
    setActiveView("chats");
    const phonePrompt = prompt("Enter phone number to chat (with country code):");
    if (phonePrompt) {
      const clean = phonePrompt.replace(/\D/g, "");
      if (clean) {
        setSelectedPhone(`+${clean}`);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface">
      {/* 1. Global Navigation: SideNavBar */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onNewChat={handleNewChat}
      />

      {/* Main Content Wrapper (offset by sidebar width) */}
      <main className="ml-sidebar-width flex-1 flex h-full p-6 lg:p-8 gap-6 lg:gap-8 overflow-hidden">
        {activeView === "dashboard" && (
          <DashboardView stats={stats} sessionInfo={sessionInfo} />
        )}

        {activeView === "chats" && (
          <>
            {/* 2. Contextual List: Chat List */}
            <ContactList
              contacts={contacts}
              selectedPhone={selectedPhone}
              onSelect={setSelectedPhone}
              search={search}
              onSearchChange={setSearch}
              stats={stats}
            />

            {/* 3. Content Area: Chat Interface */}
            <ChatWindow
              contact={selectedContact}
              onContactUpdated={loadContacts}
              sessionInfo={sessionInfo}
              onRefreshSession={loadSessionInfo}
            />
          </>
        )}

        {activeView === "broadcasts" && (
          <ComingSoonPage
            title="Broadcasts"
            icon="campaign"
            description="Create and manage WhatsApp broadcast campaigns for customer lists."
          />
        )}

        {activeView === "templates" && (
          <ComingSoonPage
            title="Message Templates"
            icon="description"
            description="Manage reusable message templates and automated reply flows."
          />
        )}

        {activeView === "settings" && (
          <ComingSoonPage
            title="Settings"
            icon="settings"
            description="Configure Wasender API tokens, webhook endpoints, and system preferences."
          />
        )}
      </main>
    </div>
  );
}
