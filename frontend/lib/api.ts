/**
 * Legacy API module — now delegates to the WA2 API service layer.
 *
 * This file preserves the same export surface (`api`, `saveStoredMessage`, type re-exports)
 * so any existing imports like `import { api } from "@/lib/api"` continue to work,
 * but internally everything routes through the WA2 API at lib/api/index.ts.
 *
 * WA2 Integration: Refactored to delegate to lib/api/ service modules.
 * Previous implementation called Wasender API directly and used localStorage.
 */

// Re-export everything from the new service layer
export { api } from "./api/index";

// Re-export types for backward compatibility
export type { Contact, Message, Stats, SessionInfo } from "./types";

/**
 * Legacy saveStoredMessage — now a no-op.
 * The WA2 API persists all messages in MongoDB, so local storage is unnecessary.
 * Kept as a no-op to avoid breaking the useRealtimeSync hook import.
 */
export const saveStoredMessage = (_msg: unknown) => {
  // No-op — WA2 API handles persistence in MongoDB
};
