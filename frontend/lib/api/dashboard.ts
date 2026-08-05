/**
 * WA2 API — Dashboard service
 *
 * Calls GET /dashboard to fetch aggregate totals and Wasender connection status.
 *
 * WA2 Integration: This file was added for the WA2 API integration.
 */

import { wa2Fetch } from "./client";
import type { WA2DashboardData } from "../types";

/**
 * GET /dashboard
 *
 * Returns:
 * - totalConversations: number of distinct conversations in MongoDB
 * - totalMessages: total message count
 * - totalUnread: sum of unread_count across all conversations
 * - connection: raw Wasender session status pass-through
 */
export async function getDashboard(): Promise<WA2DashboardData> {
  return wa2Fetch<WA2DashboardData>("/dashboard");
}
