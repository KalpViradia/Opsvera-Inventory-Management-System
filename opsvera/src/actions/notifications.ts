"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function getUnreadNotificationsCount() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) return 0;

  const count = await prisma.notification.count({
    where: {
      userId: user.id,
      companyId: user.companyId,
      isRead: false,
    },
  });

  return count;
}

export async function markNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) return;

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      companyId: user.companyId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export async function getNotifications(page = 1, limit = 20) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) return { data: [], total: 0 };

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, companyId: user.companyId },
    }),
    prisma.notification.findMany({
      where: { userId: user.id, companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) return;

  await prisma.notification.update({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
}

import { randomUUID } from "crypto";
import { emitSocketEvent } from "@/lib/socket-emitter";

export async function createCompanyNotification({
  companyId,
  title,
  message,
  type = "info",
  link,
}: {
  companyId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          id: randomUUID(),
          companyId,
          userId: u.id,
          title,
          message,
          type,
          link,
        })),
      });
    }

    await emitSocketEvent({
      target: `company:${companyId}`,
      event: "notification",
      payload: {
        title,
        message,
        type,
        link,
      },
    });
  } catch (error) {
    console.error("Failed to create company notification:", error);
  }
}

export async function checkAndTriggerLowStockAlert({
  companyId,
  productId,
  decrementQuantity,
}: {
  companyId: string;
  productId: string;
  decrementQuantity: number;
}) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, companyId },
      include: {
        stockLevels: true,
      },
    });

    if (!product || product.minStockLevel <= 0) {
      return;
    }

    const currentGlobalStock = product.stockLevels.reduce(
      (sum, level) => sum + level.quantity,
      0
    );

    const previousGlobalStock = currentGlobalStock + decrementQuantity;

    if (currentGlobalStock < product.minStockLevel && previousGlobalStock >= product.minStockLevel) {
      await createCompanyNotification({
        companyId,
        title: "Low Stock Alert",
        message: `Product "${product.name}" (SKU: ${product.sku}) has fallen below its minimum stock level of ${product.minStockLevel} (Current global stock: ${currentGlobalStock}).`,
        type: "warning",
        link: `/products`,
      });
    }
  } catch (error) {
    console.error("Error checking low stock alert:", error);
  }
}

