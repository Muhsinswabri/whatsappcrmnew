"use client";

import React from "react";

interface ComingSoonPageProps {
  title: string;
  icon: string;
  description?: string;
}

export function ComingSoonPage({
  title,
  icon,
  description,
}: ComingSoonPageProps) {
  return (
    <div className="flex-1 h-full flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        {/* Glowing icon container */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
            <span
              className="material-symbols-outlined text-primary text-[48px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 w-24 h-24 rounded-3xl bg-primary/5 blur-xl -z-10" />
        </div>

        <h2 className="text-headline-md text-on-surface font-bold mb-3">
          {title}
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-6">
          {description || "This feature is under development and will be available soon."}
        </p>

        {/* Coming Soon Badge */}
        <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant text-label-md">
          <span className="material-symbols-outlined text-[16px] text-primary">
            schedule
          </span>
          Coming Soon
        </span>
      </div>
    </div>
  );
}
