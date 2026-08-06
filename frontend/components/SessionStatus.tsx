"use client";

import React, { useState } from "react";
import { SessionInfo } from "@/lib/types";
import { api } from "@/lib/api";

interface SessionStatusProps {
  sessionInfo: SessionInfo | null;
  onRefresh: () => void;
}

export function SessionStatus({ sessionInfo, onRefresh }: SessionStatusProps) {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = sessionInfo?.status || "unknown";
  const isConnected = status === "connected";

  const handleConnect = async () => {
    setLoading(true);
    setActionError(null);
    try {
      await api.connectSession();
      const qr = await api.getQRCode();
      if (qr) {
        setQrCodeData(qr);
        setShowQR(true);
      }
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to connect session");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp session?")) return;
    setLoading(true);
    setActionError(null);
    try {
      await api.disconnectSession();
      setShowQR(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to disconnect session");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    setActionError(null);
    try {
      await api.restartSession();
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to restart session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-primary-container text-on-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            title="Connect WhatsApp / Scan QR"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            {loading ? "Connecting..." : "Link Device"}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="bg-surface-container border border-outline-variant hover:border-error/50 text-on-surface p-2 rounded-xl transition-colors group disabled:opacity-50"
            title="Disconnect"
          >
            <span className="material-symbols-outlined text-sm block group-hover:text-error">
              logout
            </span>
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-surface-container border border-outline-variant hover:border-primary/50 text-on-surface p-2 rounded-xl transition-colors disabled:opacity-50"
          title="Refresh Status"
        >
          <span className="material-symbols-outlined text-sm block">refresh</span>
        </button>

        <button
          onClick={handleRestart}
          disabled={loading}
          className="bg-surface-container border border-outline-variant hover:border-primary/50 text-on-surface p-2 rounded-xl transition-colors disabled:opacity-50"
          title="Restart Session"
        >
          <span className="material-symbols-outlined text-sm block">restart_alt</span>
        </button>
      </div>

      {actionError && (
        <div className="text-xs text-error absolute top-full mt-1 right-0 bg-surface-container-highest px-3 py-1 rounded-lg border border-error/30 shadow-md">
          {actionError}
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-headline-sm text-on-surface font-bold">Scan WhatsApp QR Code</h3>
            <p className="text-xs text-on-surface-variant">
              Open WhatsApp on your phone → Linked Devices → Link a Device, and scan the QR code below.
            </p>

            {qrCodeData ? (
              <div className="flex justify-center p-4 bg-white rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeData.startsWith("data:") ? qrCodeData : `data:image/png;base64,${qrCodeData}`}
                  alt="WhatsApp Session QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
            ) : (
              <div className="py-12 text-on-surface-variant text-sm animate-pulse">
                Fetching QR Code...
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowQR(false)}
                className="w-full py-2.5 rounded-xl bg-surface-container-highest text-on-surface hover:bg-surface-variant font-medium text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
