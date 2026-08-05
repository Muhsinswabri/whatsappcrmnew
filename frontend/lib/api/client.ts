/**
 * WA2 API — Base HTTP client
 *
 * All WA2 API calls route through the Next.js rewrite proxy at /wa2-api/*
 * so no API keys or secrets are exposed in the browser.
 *
 * WA2 Integration: This file was added for the WA2 API integration.
 */

// ─── Error class ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Base request helper ────────────────────────────────────────────────────────

const WA2_PROXY_BASE = "/wa2-api";

export async function wa2Fetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WA2_PROXY_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...options, headers });

  // Try to parse JSON body regardless of status
  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const errorMsg =
      body?.message || body?.error || `WA2 API error (${res.status})`;
    throw new ApiError(errorMsg, res.status, body);
  }

  // WA2 API wraps responses in { success, data } — return `data` directly
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }

  return body as T;
}
