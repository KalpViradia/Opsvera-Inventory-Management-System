/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility to emit events to the Socket.IO server.
 * Uses the internal /api/events HTTP endpoint on the socket server.
 */

interface EmitOptions {
  target: string; // e.g., "user:123", "company:456"
  event: string;  // e.g., "stock_updated", "order_status_changed", "notification"
  payload: any;
}

export async function emitSocketEvent({ target, event, payload }: EmitOptions) {
  // Fire and forget pattern - don't await this in the main thread if possible,
  // or catch errors so it doesn't break the main request
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const apiKey = process.env.SOCKET_API_KEY;
    
    if (!apiKey) {
      console.warn("[Socket Emitter] Missing SOCKET_API_KEY. Event emission skipped.");
      return;
    }

    const response = await fetch(`${socketUrl}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ target, event, payload }),
    });

    if (!response.ok) {
      console.error(`[Socket Emitter] Failed to emit event. Status: ${response.status}`);
    }
  } catch (error) {
    console.error("[Socket Emitter] Error emitting event:", error);
  }
}
