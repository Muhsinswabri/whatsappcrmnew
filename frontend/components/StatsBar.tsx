"use client";

import React from "react";
import { Stats } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 16px", borderRight: "1px solid #222d34" }}>
      <span style={{ color: "#8696a0", fontSize: 11 }}>{label}</span>
      <span style={{ color: "#e9edef", fontSize: 18, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function StatsBar({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  return (
    <div style={{ display: "flex", background: "#202c33", borderBottom: "1px solid #222d34" }}>
      <StatCard label="Contacts" value={stats.total_contacts} />
      <StatCard label="Messages today" value={stats.messages_today} />
      <StatCard label="Human takeovers" value={stats.human_takeovers} />
      <StatCard label="Failed today" value={stats.failed_automations} />
    </div>
  );
}
