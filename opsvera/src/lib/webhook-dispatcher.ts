import crypto from "crypto";
import prisma from "@/lib/prisma";

export type WebhookPayload = Record<string, unknown>;

export async function dispatchWebhook(companyId: string, event: string, payload: WebhookPayload) {
  try {
    // 1. Find active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        companyId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    // 2. Dispatch to each webhook
    // Note: In a true production environment, you'd enqueue these into a background worker (like Redis/BullMQ)
    // For this architecture, we run them asynchronously without awaiting them in the main request thread.
    webhooks.forEach((webhook) => {
      sendPayload(webhook, event, payload).catch((err) => {
        console.error(`Failed to dispatch webhook ${webhook.id}:`, err);
      });
    });
  } catch (error) {
    console.error("Error in webhook dispatcher:", error);
  }
}

async function sendPayload(
  webhook: { id: string; url: string; secret: string },
  event: string,
  payload: WebhookPayload,
  attempt = 1
) {
  const maxAttempts = 3;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({ event, payload });

  // Generate HMAC signature (Opsvera Standard)
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  let statusCode: number | null = null;
  let responseText: string | null = null;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Opsvera-Event": event,
        "Opsvera-Timestamp": timestamp,
        "Opsvera-Signature": `v1=${signature}`,
      },
      body,
    });

    statusCode = res.status;
    responseText = await res.text();

    if (!res.ok && attempt < maxAttempts) {
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      setTimeout(() => sendPayload(webhook, event, payload, attempt + 1), delay);
    }
  } catch (error) {
    responseText = (error as Error).message;
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000;
      setTimeout(() => sendPayload(webhook, event, payload, attempt + 1), delay);
    }
  }

  // Log the attempt
  await prisma.webhookLog.create({
    data: {
      webhookId: webhook.id,
      event,
      payload: payload as unknown as import("@prisma/client").Prisma.InputJsonValue,
      statusCode,
      response: responseText ? responseText.substring(0, 1000) : null,
      attempt,
    },
  });
}
