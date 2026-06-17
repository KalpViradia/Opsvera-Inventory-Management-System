"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { emitSocketEvent } from "@/lib/socket-emitter";
import { 
  CreateStockEntryInput, 
  createStockEntrySchema 
} from "@/validations/inventory";
import { revalidatePath } from "next/cache";
import { checkAndTriggerLowStockAlert } from "@/actions/notifications";

export async function getStockLevels() {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const stockLevels = await prisma.stockLevel.findMany({
    where: {
      location: {
        companyId: user.companyId!,
      },
    },
    include: {
      product: {
        include: {
          category: true,
          unit: true,
        },
      },
      location: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });

  return JSON.parse(JSON.stringify({ data: stockLevels }));
}

export async function getStockEntries() {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const entries = await prisma.stockEntry.findMany({
    where: {
      companyId: user.companyId!,
    },
    include: {
      product: true,
      fromLocation: {
        include: { warehouse: true }
      },
      toLocation: {
        include: { warehouse: true }
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return JSON.parse(JSON.stringify({ data: entries }));
}

export async function getBatches() {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const batches = await prisma.batch.findMany({
    where: { companyId: user.companyId! },
    include: { product: true },
    orderBy: { expiresAt: "asc" },
  });

  return JSON.parse(JSON.stringify({ data: batches }));
}

export async function getSerialNumbers() {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const serials = await prisma.serialNumber.findMany({
    where: { companyId: user.companyId! },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify({ data: serials }));
}

export async function createStockEntry(data: CreateStockEntryInput) {
  const user = await requireCompany();
  await requirePermission("inventory:write");

  const parsed = createStockEntrySchema.parse(data);

  const result = await prisma.$transaction(async (tx) => {
    // 0. Get company valuation method and current product stats
    const company = await tx.company.findUnique({ where: { id: user.companyId! }});
    const product = await tx.product.findUnique({ where: { id: parsed.productId }});
    if (!company || !product) throw new Error("Invalid state");

    if (product.isBatchTracked && !parsed.batchNumber) {
      throw new Error(`Product ${product.name} requires batch tracking. Please provide a Batch Number.`);
    }

    // 1. Create the entry
    const entry = await tx.stockEntry.create({
      data: {
        companyId: user.companyId!,
        productId: parsed.productId,
        type: parsed.type,
        quantity: parsed.quantity,
        remainingQty: parsed.type === "RECEIPT" ? parsed.quantity : 0,
        fromLocationId: parsed.fromLocationId,
        toLocationId: parsed.toLocationId,
        notes: parsed.notes,
        unitCost: parsed.unitCost,
        createdBy: user.id,
      },
    });

    let blendedUnitCost = Number(product.averageCost || 0);

    // 1.5 Valuation Logic
    if (parsed.type === "RECEIPT" && parsed.unitCost !== undefined) {
      if (company.stockValuationMethod === "WEIGHTED_AVERAGE") {
        const currentTotalLevel = await tx.stockLevel.aggregate({
          where: { productId: parsed.productId },
          _sum: { quantity: true }
        });
        const currentStockQty = currentTotalLevel._sum.quantity || 0;
        const currentAvgCost = Number(product.averageCost || 0);

        const newTotalQty = currentStockQty + parsed.quantity;
        const newAvgCost = ((currentStockQty * currentAvgCost) + (parsed.quantity * parsed.unitCost)) / newTotalQty;

        await tx.product.update({
          where: { id: parsed.productId },
          data: { averageCost: newAvgCost }
        });
      }
    } else if (parsed.type === "DELIVERY" && company.stockValuationMethod === "FIFO") {
      // FIFO Logic: Consume oldest receipts first
      const receipts = await tx.stockEntry.findMany({
        where: {
          companyId: user.companyId!,
          productId: parsed.productId,
          type: "RECEIPT",
          remainingQty: { gt: 0 }
        },
        orderBy: { createdAt: "asc" }
      });

      let qtyToConsume = parsed.quantity;
      let totalCost = 0;

      for (const receipt of receipts) {
        if (qtyToConsume <= 0) break;
        const consumed = Math.min(receipt.remainingQty, qtyToConsume);
        totalCost += consumed * Number(receipt.unitCost || 0);
        qtyToConsume -= consumed;

        await tx.stockEntry.update({
          where: { id: receipt.id },
          data: { remainingQty: receipt.remainingQty - consumed }
        });
      }

      if (parsed.quantity > 0) {
        blendedUnitCost = totalCost / parsed.quantity;
        
        // Update the delivery entry with the computed blended cost
        await tx.stockEntry.update({
          where: { id: entry.id },
          data: { unitCost: blendedUnitCost }
        });
      }
    }

    // 1.6 Batch and Serial Numbers
    if (parsed.batchNumber) {
      await tx.batch.upsert({
        where: {
          companyId_productId_batchNumber: {
            companyId: user.companyId!,
            productId: parsed.productId,
            batchNumber: parsed.batchNumber
          }
        },
        create: {
          companyId: user.companyId!,
          productId: parsed.productId,
          batchNumber: parsed.batchNumber,
          quantity: parsed.type === "RECEIPT" ? parsed.quantity : 0,
          locationId: parsed.toLocationId,
          expiresAt: parsed.expiresAt
        },
        update: {
          quantity: parsed.type === "RECEIPT" ? { increment: parsed.quantity } : 
                    (parsed.type === "DELIVERY" ? { decrement: Math.min(parsed.quantity, 999999) } : undefined) // Simplistic decrement
        }
      });
    }

    if (parsed.serialNumbers && parsed.serialNumbers.length > 0) {
      if (parsed.type === "RECEIPT") {
        for (const sn of parsed.serialNumbers) {
          await tx.serialNumber.create({
            data: {
              companyId: user.companyId!,
              productId: parsed.productId,
              serialNumber: sn,
              locationId: parsed.toLocationId,
            }
          });
        }
      } else if (parsed.type === "DELIVERY") {
        for (const sn of parsed.serialNumbers) {
          await tx.serialNumber.update({
            where: {
              companyId_productId_serialNumber: {
                companyId: user.companyId!,
                productId: parsed.productId,
                serialNumber: sn
              }
            },
            data: {
              status: "SOLD"
            }
          });
        }
      }
    }

    // 2. Decrement source if applicable
    if (parsed.fromLocationId) {
      const sourceLevel = await tx.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: parsed.productId,
            locationId: parsed.fromLocationId,
          }
        }
      });
      
      if (!sourceLevel || sourceLevel.quantity < parsed.quantity) {
        throw new Error("Insufficient stock in source location");
      }

      await tx.stockLevel.update({
        where: {
          id: sourceLevel.id,
        },
        data: {
          quantity: {
            decrement: parsed.quantity,
          }
        }
      });
    }

    // 3. Increment destination if applicable
    if (parsed.toLocationId) {
      const destLevel = await tx.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: parsed.productId,
            locationId: parsed.toLocationId,
          }
        }
      });

      if (destLevel) {
        await tx.stockLevel.update({
          where: {
            id: destLevel.id,
          },
          data: {
            quantity: {
              increment: parsed.quantity,
            }
          }
        });
      } else {
        await tx.stockLevel.create({
          data: {
            productId: parsed.productId,
            locationId: parsed.toLocationId,
            quantity: parsed.quantity,
          }
        });
      }
    }

    return entry;
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/entries");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: parsed.type === "TRANSFER" ? "TRANSFER" : "CREATED",
    entityType: "StockEntry",
    entityId: result.id,
    details: `${parsed.type} stock entry: ${parsed.quantity} units of product`,
  });

  // Emit event to company room
  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "stock_updated",
    payload: {
      source: "MANUAL_ENTRY",
      type: parsed.type,
      productId: parsed.productId,
    },
  });

  if (parsed.fromLocationId && !parsed.toLocationId) {
    await checkAndTriggerLowStockAlert({
      companyId: user.companyId!,
      productId: parsed.productId,
      decrementQuantity: parsed.quantity,
    });
  }

  return { data: result };
}
