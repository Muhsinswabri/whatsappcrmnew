"use client";

import { useEffect, useRef } from "react";

/**
 * n8n webhooks are request/response only — there's no push channel available
 * without standing up a separate realtime server, which is outside this
 * project's stack (n8n + Mongo + Next.js + WaSenderAPI only). Short polling
 * is the pragmatic way to get "live" updates within that constraint.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
