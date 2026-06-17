import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function validateApiKey(requiredScope: string = "read") {
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header. Expected 'Bearer <api_key>'", status: 401 };
  }

  const keyString = authHeader.substring(7); // Remove "Bearer "

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: keyString },
    include: { company: true },
  });

  if (!apiKey || !apiKey.isActive) {
    return { error: "Invalid or inactive API key", status: 401 };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { error: "API key has expired", status: 401 };
  }

  if (requiredScope !== "read" && !apiKey.scopes.includes("admin") && !apiKey.scopes.includes(requiredScope)) {
    return { error: `Insufficient scope. Requires '${requiredScope}'`, status: 403 };
  }

  // Update last used asynchronously (don't await to save latency)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { companyId: apiKey.companyId, company: apiKey.company, status: 200 };
}
