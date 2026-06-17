"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { emitSocketEvent } from "@/lib/socket-emitter";
import { 
  createPOSchema, 
  updatePOStatusSchema,
  receivePOSchema
} from "@/validations/purchase";
import { z } from "zod";
import { POStatus, InvoiceStatus, StockEntryType } from "@prisma/client";

async function generatePONumber(companyId: string): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  
  const seq = await prisma.sequence.upsert({
    where: { companyId_type: { companyId, type: "PO" } },
    update: { value: { increment: 1 } },
    create: { companyId, type: "PO", value: 1 },
  });

  const paddedSeq = seq.value.toString().padStart(4, "0");
  return `PO-${year}${month}-${paddedSeq}`;
}

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `PINV-${year}${month}-${suffix}`;
}

export async function getPurchaseOrders() {
  const user = await requireCompany();
  await requirePermission("purchases:read");

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { companyId: user.companyId },
    include: {
      supplier: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify({ data: purchaseOrders }));
}

export async function getPurchaseOrderById(id: string) {
  const user = await requireCompany();
  await requirePermission("purchases:read");

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      supplier: true,
      items: {
        include: {
          product: true
        }
      },
      invoices: true,
    },
  });

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  return JSON.parse(JSON.stringify({ data: purchaseOrder }));
}

export async function createPurchaseOrder(input: z.infer<typeof createPOSchema>) {
  const user = await requireCompany();
  await requirePermission("purchases:write");
  
  const validatedData = createPOSchema.parse(input);

  let totalAmount = 0;
  let totalTaxAmount = 0;

  const itemsData = validatedData.items.map(item => {
    const lineTotal = item.quantity * item.unitPrice;
    const lineTax = lineTotal * (item.taxRate / 100);
    
    totalAmount += lineTotal;
    totalTaxAmount += lineTax;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      total: lineTotal,
    };
  });

  totalAmount += totalTaxAmount; // Grand total including tax

  const poNumber = validatedData.poNumber || (await generatePONumber(user.companyId));

  const po = await prisma.purchaseOrder.create({
    data: {
      companyId: user.companyId,
      supplierId: validatedData.supplierId,
      poNumber: poNumber,
      status: validatedData.status,
      notes: validatedData.notes,
      totalAmount,
      taxAmount: totalTaxAmount,
      createdBy: user.id,
      items: {
        create: itemsData,
      }
    },
  });

  revalidatePath("/purchases");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "PurchaseOrder",
    entityId: po.id,
    details: `Created purchase order ${po.poNumber}`,
  });

  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "notification",
    payload: {
      title: "New Purchase Order",
      message: `PO ${po.poNumber} has been created.`,
      type: "info",
    }
  });

  return { data: po };
}

export async function updatePurchaseOrderStatus(id: string, input: z.infer<typeof updatePOStatusSchema>) {
  const user = await requireCompany();
  await requirePermission("purchases:write");
  
  const validatedData = updatePOStatusSchema.parse(input);

  const existingPO = await prisma.purchaseOrder.findUnique({
    where: { id, companyId: user.companyId }
  });

  if (!existingPO) {
    throw new Error("Purchase order not found");
  }

  // State machine validation
  if (existingPO.status === "CANCELLED" || existingPO.status === "CLOSED") {
    throw new Error(`Cannot update PO from ${existingPO.status} state`);
  }

  const dataToUpdate: {
    status: POStatus;
    notes?: string;
    approvedBy?: string;
    approvedAt?: Date;
  } = {
    status: validatedData.status,
  };

  if (validatedData.notes) {
    dataToUpdate.notes = validatedData.notes;
  }

  if (validatedData.status === "APPROVED" && existingPO.status !== "APPROVED") {
    // Approving a PO requires the approve permission, not just write
    await requirePermission("purchases:approve");
    dataToUpdate.approvedBy = user.id;
    dataToUpdate.approvedAt = new Date();
  }

  const po = await prisma.purchaseOrder.update({
    where: { id, companyId: user.companyId },
    data: dataToUpdate,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);

  const actionName = validatedData.status === "APPROVED" ? "APPROVED" : "UPDATED";
  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: actionName,
    entityType: "PurchaseOrder",
    entityId: id,
    details: `Purchase order status changed to ${validatedData.status}`,
  });

  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "notification",
    payload: {
      title: "Purchase Order Updated",
      message: `PO ${po.poNumber} is now ${validatedData.status}.`,
      type: "info",
    }
  });
  
  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "order_status_changed",
    payload: {
      type: "PURCHASE_ORDER",
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
    },
  });



  return { data: po };
}

export async function receivePurchaseOrder(id: string, input: z.infer<typeof receivePOSchema>) {
  const user = await requireCompany();
  await requirePermission("purchases:write");
  // Also requires inventory write access since we're modifying stock
  await requirePermission("inventory:write");
  
  const validatedData = receivePOSchema.parse(input);

  // Run in a transaction to ensure atomic stock updates and PO updates
  const result = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id, companyId: user.companyId },
      include: { items: true }
    });

    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "APPROVED") {
      throw new Error(`Cannot receive items for PO in ${po.status} state. Must be APPROVED.`);
    }

    // Process each received item
    let allItemsFullyReceived = true;
    let totalReceivedValue = 0;

    for (const receivedItem of validatedData.items) {
      const poItem = po.items.find(i => i.id === receivedItem.id);
      if (!poItem) throw new Error(`PO Item ${receivedItem.id} not found`);

      const remainingToReceive = poItem.quantity - poItem.receivedQty;
      if (receivedItem.receiveQty > remainingToReceive) {
        throw new Error(`Cannot receive more than ordered for item ${poItem.productId}`);
      }

      // Update PO Item received quantity
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          receivedQty: { increment: receivedItem.receiveQty }
        }
      });

      if (poItem.receivedQty + receivedItem.receiveQty < poItem.quantity) {
        allItemsFullyReceived = false;
      }

      totalReceivedValue += receivedItem.receiveQty * Number(poItem.unitPrice);

      // Add to inventory stock level
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          productId: poItem.productId,
          locationId: validatedData.locationId,
        }
      });

      if (stockLevel) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: { quantity: { increment: receivedItem.receiveQty } }
        });
      } else {
        await tx.stockLevel.create({
          data: {
            productId: poItem.productId,
            locationId: validatedData.locationId,
            quantity: receivedItem.receiveQty,
          }
        });
      }

      // Record stock ledger entry
      await tx.stockEntry.create({
        data: {
          type: StockEntryType.RECEIPT,
          productId: poItem.productId,
          quantity: receivedItem.receiveQty,
          toLocationId: validatedData.locationId,
          refId: po.id,
          refType: "PURCHASE_ORDER",
          notes: validatedData.notes,
          createdBy: user.id,
          companyId: user.companyId,
        }
      });
    }

    // Generate Journal Entry for Receipt
    if (totalReceivedValue > 0) {
      const inventoryAccount = await tx.ledgerAccount.findUnique({
        where: { companyId_code: { companyId: user.companyId, code: "1040" } }
      });
      const apAccount = await tx.ledgerAccount.findUnique({
        where: { companyId_code: { companyId: user.companyId, code: "2010" } }
      });

      if (inventoryAccount && apAccount) {
        const count = await tx.journalEntry.count({ where: { companyId: user.companyId } });
        const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
        
        await tx.journalEntry.create({
          data: {
            companyId: user.companyId,
            entryNumber,
            date: new Date(),
            narration: `Goods received against PO: ${po.poNumber}`,
            refType: "PURCHASE_ORDER",
            refId: po.id,
            totalAmount: totalReceivedValue,
            createdBy: user.id,
            items: {
              create: [
                { accountId: inventoryAccount.id, debit: totalReceivedValue, credit: 0, partyType: "SUPPLIER", partyId: po.supplierId },
                { accountId: apAccount.id, debit: 0, credit: totalReceivedValue, partyType: "SUPPLIER", partyId: po.supplierId },
              ]
            }
          }
        });

        // Update balances
        await tx.ledgerAccount.update({
          where: { id: inventoryAccount.id },
          data: { balance: { increment: totalReceivedValue } }
        });
        await tx.ledgerAccount.update({
          where: { id: apAccount.id },
          data: { balance: { increment: totalReceivedValue } }
        });
      }
    }

    // Update overall PO status
    const newStatus = allItemsFullyReceived ? POStatus.RECEIVED : POStatus.APPROVED;
    
    const updatedPO = await tx.purchaseOrder.update({
      where: { id },
      data: { status: newStatus }
    });

    return updatedPO;
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "RECEIVED",
    entityType: "PurchaseOrder",
    entityId: id,
    details: `Received items for purchase order`,
  });

  // Emit event to company room
  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "stock_updated",
    payload: {
      source: "PURCHASE_ORDER_RECEIPT",
      poId: id,
    },
  });

  return { data: result };
}

export async function generatePurchaseInvoice(poId: string) {
  const user = await requireCompany();
  await requirePermission("purchases:write");
  
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId, companyId: user.companyId }
  });

  if (!po) throw new Error("Purchase order not found");
  
  // Create an invoice for the full amount of the PO
  const invoice = await prisma.purchaseInvoice.create({
    data: {
      companyId: user.companyId,
      supplierId: po.supplierId,
      poId: po.id,
      invoiceNumber: generateInvoiceNumber(),
      status: InvoiceStatus.UNPAID,
      amount: po.totalAmount,
      taxAmount: po.taxAmount,
    }
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${poId}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "PurchaseOrder",
    entityId: invoice.id,
    details: `Generated purchase invoice ${invoice.invoiceNumber} for PO ${po.poNumber || poId}`,
  });

  return { data: invoice };
}
