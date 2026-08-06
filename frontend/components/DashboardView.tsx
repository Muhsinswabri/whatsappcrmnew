"use client";

import React from "react";
import { Stats, SessionInfo } from "@/lib/types";

interface DashboardViewProps {
  stats: Stats | null;
  sessionInfo: SessionInfo | null;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
}

function StatCard({ icon, label, value, color, bgColor, borderColor }: StatCardProps) {
  return (
    <div
      className={`bg-surface-container rounded-3xl p-6 border ${borderColor} flex flex-col gap-4 shadow-lg hover:shadow-xl transition-shadow duration-300`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}
        >
          <span className={`material-symbols-outlined text-[24px] ${color}`}>
            {icon}
          </span>
        </div>
      </div>
      <div>
        <p className="text-on-surface-variant text-label-md mb-1">{label}</p>
        <p className="text-on-surface text-headline-md font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

export function DashboardView({ stats, sessionInfo }: DashboardViewProps) {
  const isConnected = sessionInfo?.status === "connected";

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 chat-scroll">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface font-bold">
          Dashboard
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Overview of your WhatsApp CRM performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="contacts"
          label="Total Contacts"
          value={stats?.total_contacts ?? "—"}
          color="text-primary"
          bgColor="bg-primary/10"
          borderColor="border-outline-variant/30"
        />
        <StatCard
          icon="chat_bubble"
          label="Messages Today"
          value={stats?.messages_today ?? "—"}
          color="text-secondary"
          bgColor="bg-secondary/10"
          borderColor="border-outline-variant/30"
        />
        <StatCard
          icon={isConnected ? "wifi" : "wifi_off"}
          label="WhatsApp Session"
          value={isConnected ? "Connected" : sessionInfo?.status === "connecting" ? "Connecting..." : "Disconnected"}
          color={isConnected ? "text-primary" : "text-error"}
          bgColor={isConnected ? "bg-primary/10" : "bg-error/10"}
          borderColor="border-outline-variant/30"
        />
        <StatCard
          icon="error_outline"
          label="Failed Messages"
          value={stats?.failed_automations ?? "—"}
          color="text-error"
          bgColor="bg-error/10"
          borderColor="border-outline-variant/30"
        />
        <StatCard
          icon="person"
          label="Human Takeovers"
          value={stats?.human_takeovers ?? "—"}
          color="text-tertiary"
          bgColor="bg-tertiary/10"
          borderColor="border-outline-variant/30"
        />
        <StatCard
          icon="trending_up"
          label="Automation Active"
          value={
            stats
              ? `${Math.max(0, (stats.total_contacts || 0) - (stats.human_takeovers || 0))} contacts`
              : "—"
          }
          color="text-primary-fixed-dim"
          bgColor="bg-primary-fixed-dim/10"
          borderColor="border-outline-variant/30"
        />
      </div>

      {/* Session Info Card */}
      {sessionInfo && (
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 shadow-lg">
          <h3 className="text-headline-sm text-on-surface font-semibold mb-4">
            Session Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                phone_android
              </span>
              <div>
                <p className="text-label-md text-on-surface-variant">Phone Number</p>
                <p className="text-body-md text-on-surface">
                  {sessionInfo.phone_number || "Not available"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                badge
              </span>
              <div>
                <p className="text-label-md text-on-surface-variant">Session Name</p>
                <p className="text-body-md text-on-surface">
                  {sessionInfo.name || "Not available"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[20px] ${isConnected ? "text-primary" : "text-error"}`}
              >
                {isConnected ? "check_circle" : "cancel"}
              </span>
              <div>
                <p className="text-label-md text-on-surface-variant">Status</p>
                <p
                  className={`text-body-md font-medium ${isConnected ? "text-primary" : "text-error"}`}
                >
                  {sessionInfo.status?.charAt(0).toUpperCase() +
                    sessionInfo.status?.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
