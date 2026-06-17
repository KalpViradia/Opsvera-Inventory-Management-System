"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { emitSocketEvent } from "@/lib/socket-emitter";
import { checkAndTriggerLowStockAlert } from "@/actions/notifications";
import { 
  createSOSchema, 
  updateSOStatusSchema,
  shipSOSchema
} from "@/validations/sales";
import { z } from "zod";
import { SOStatus, InvoiceStatus, StockEntryType } from "@prisma/client";

async function generateSONumber(companyId: string): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const seq = await prisma.sequence.upsert({
    where: { companyId_type: { companyId, type: "SO" } },
    update: { value: { increment: 1 } },
    create: { companyId, type: "SO", value: 1 },
  });

  const paddedSeq = seq.value.toString().padStart(4, "0");
  return `SO-${year}${month}-${paddedSeq}`;
}

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `INV-${year}${month}-${suffix}`;
}

export async function getSalesOrders() {
  const user = await requireCompany();
  await requirePermission("sales:read");

  const salesOrders = await prisma.salesOrder.findMany({
    where: { companyId: user.companyId },
    include: {
      customer: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify({ data: salesOrders }));
}

export async function getSalesOrderById(id: string) {
  const user = await requireCompany();
  await requirePermission("sales:read");

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      },
      invoices: true,
      shipments: true,
    },
  });

  if (!salesOrder) {
    throw new Error("Sales order not found");
  }

  return JSON.parse(JSON.stringify({ data: salesOrder }));
}

export async function createSalesOrder(input: z.infer<typeof createSOSchema>) {
  const user = await requireCompany();
  await requirePermission("sales:write");
  
  const validatedData = createSOSchema.parse(input);

  let totalAmount = 0;
  let totalTaxAmount = 0;

  const itemsData = validatedData.items.map(item => {
    const lineTotalBeforeDiscount = item.quantity * item.unitPrice;
    const lineTotal = lineTotalBeforeDiscount - item.discount;
    const lineTax = lineTotal * (item.taxRate / 100);
    
    totalAmount += lineTotal;
    totalTaxAmount += lineTax;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      total: lineTotal,
    };
  });

  totalAmount += totalTaxAmount;
  totalAmount -= validatedData.discount;

  const so = await prisma.salesOrder.create({
    data: {
      companyId: user.companyId,
      customerId: validatedData.customerId,
      soNumber: validatedData.soNumber || (await generateSONumber(user.companyId)),
      status: validatedData.status,
      notes: validatedData.notes,
      totalAmount,
      taxAmount: totalTaxAmount,
      discount: validatedData.discount,
      createdBy: user.id,
      items: {
        create: itemsData,
      }
    },
  });

  revalidatePath("/sales");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "SalesOrder",
    entityId: so.id,
    details: `Created sales order ${so.soNumber}`,
  });

  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "notification",
    payload: {
      title: "New Sales Order",
      message: `SO ${so.soNumber} has been created.`,
      type: "info",
    }
  });

  return { data: so };
}

export async function updateSalesOrderStatus(id: string, input: z.infer<typeof updateSOStatusSchema>) {
  const user = await requireCompany();
  await requirePermission("sales:write");
  
  const validatedData = updateSOStatusSchema.parse(input);

  const existingSO = await prisma.salesOrder.findUnique({
    where: { id, companyId: user.companyId }
  });

  if (!existingSO) {
    throw new Error("Sales order not found");
  }

  if (existingSO.status === "CANCELLED" || existingSO.status === "CLOSED") {
    throw new Error(`Cannot update SO from ${existingSO.status} state`);
  }

  const dataToUpdate: {
    status: SOStatus;
    notes?: string;
  } = {
    status: validatedData.status,
  };

  if (validatedData.notes) {
    dataToUpdate.notes = validatedData.notes;
  }

  // Confirming a SO requires the approve permission, not just write
  if (validatedData.status === "CONFIRMED" && existingSO.status !== "CONFIRMED") {
    await requirePermission("sales:approve");
  }

  const so = await prisma.salesOrder.update({
    where: { id, companyId: user.companyId },
    data: dataToUpdate,
  });

  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);

  const actionName = validatedData.status === "CONFIRMED" ? "CONFIRMED" : "UPDATED";
  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: actionName,
    entityType: "SalesOrder",
    entityId: id,
    details: `Sales order status changed to ${validatedData.status}`,
  });

  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "notification",
    payload: {
      title: "Sales Order Updated",
      message: `SO ${so.soNumber} is now ${validatedData.status}.`,
      type: "info",
    }
  });

  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "order_status_changed",
    payload: {
      type: "SALES_ORDER",
      id: so.id,
      soNumber: so.soNumber,
      status: so.status,
    },
  });

  return { data: so };
}

export async function shipSalesOrder(id: string, input: z.infer<typeof shipSOSchema>) {
  const user = await requireCompany();
  await requirePermission("sales:write");
  await requirePermission("inventory:write");
  
  const validatedData = shipSOSchema.parse(input);


  const result = await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({
      where: { id, companyId: user.companyId },
      include: { items: true }
    });

    if (!so) throw new Error("Sales order not found");
    if (so.status !== "CONFIRMED" && so.status !== "PACKED") {
      throw new Error("Only CONFIRMED or PACKED sales orders can be shipped.");
    }

    // Check stock and create entries
    for (const shippedItem of validatedData.items) {
      const soItem = so.items.find(i => i.id === shippedItem.id);
      if (!soItem) throw new Error(`SO Item ${shippedItem.id} not found.`);
      if (shippedItem.quantity > soItem.quantity) {
        throw new Error(`Cannot ship ${shippedItem.quantity}. Ordered only ${soItem.quantity}.`);
      }

      // Check Stock Level
      const existingStock = await tx.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: soItem.productId,
            locationId: validatedData.locationId
          }
        }
      });

      if (!existingStock || existingStock.quantity < shippedItem.quantity) {
        throw new Error(`Insufficient stock for product ${soItem.productId} in the selected location.`);
      }

      // Deduct Stock
      await tx.stockLevel.update({
        where: { id: existingStock.id },
        data: { quantity: { decrement: shippedItem.quantity } }
      });

      // Create Stock Entry (DELIVERY)
      await tx.stockEntry.create({
        data: {
          companyId: user.companyId,
          productId: soItem.productId,
          fromLocationId: validatedData.locationId,
          quantity: shippedItem.quantity,
          type: StockEntryType.DELIVERY,
          refType: "SALES_ORDER",
          refId: so.id,
          notes: validatedData.notes,
          createdBy: user.id
        }
      });
    }

    // Update SO Status to SHIPPED
    await tx.salesOrder.update({
      where: { id: so.id },
      data: { status: "SHIPPED" }
    });

    // Automatically generate a SalesInvoice for the full order amount
    // In a real system, you might generate partial invoices based on shipped quantities
    await tx.salesInvoice.create({
      data: {
        companyId: user.companyId,
        soId: so.id,
        customerId: so.customerId,
        invoiceNumber: generateInvoiceNumber(),
        amount: so.totalAmount,
        taxAmount: so.taxAmount,
        status: InvoiceStatus.UNPAID,
      }
    });

    // Generate Journal Entry for Shipment (AR vs Revenue)
    if (Number(so.totalAmount) > 0) {
      const arAccount = await tx.ledgerAccount.findUnique({
        where: { companyId_code: { companyId: user.companyId, code: "1030" } }
      });
      const revenueAccount = await tx.ledgerAccount.findUnique({
        where: { companyId_code: { companyId: user.companyId, code: "4010" } }
      });

      if (arAccount && revenueAccount) {
        const count = await tx.journalEntry.count({ where: { companyId: user.companyId } });
        const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
        
        await tx.journalEntry.create({
          data: {
            companyId: user.companyId,
            entryNumber,
            date: new Date(),
            narration: `Sales Invoice generated for SO: ${so.soNumber}`,
            refType: "SALES_ORDER",
            refId: so.id,
            totalAmount: so.totalAmount,
            createdBy: user.id,
            items: {
              create: [
                { accountId: arAccount.id, debit: so.totalAmount, credit: 0, partyType: "CUSTOMER", partyId: so.customerId },
                { accountId: revenueAccount.id, debit: 0, credit: so.totalAmount, partyType: "CUSTOMER", partyId: so.customerId },
              ]
            }
          }
        });

        // Update balances
        await tx.ledgerAccount.update({
          where: { id: arAccount.id },
          data: { balance: { increment: so.totalAmount } }
        });
        await tx.ledgerAccount.update({
          where: { id: revenueAccount.id },
          data: { balance: { increment: so.totalAmount } } // Credit (+) normal balance
        });
      }
    }

    const shippedProducts = validatedData.items.map((shippedItem) => {
      const soItem = so.items.find(i => i.id === shippedItem.id);
      return {
        productId: soItem!.productId,
        quantity: shippedItem.quantity,
      };
    });

    return {
      shippedProducts,
    };
  });

  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
  revalidatePath("/inventory"); // Stock levels changed
  
  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "SHIPPED",
    entityType: "SalesOrder",
    entityId: id,
    details: `Shipped sales order and generated invoice`,
  });

  // Emit event to company room
  await emitSocketEvent({
    target: `company:${user.companyId}`,
    event: "stock_updated",
    payload: {
      source: "SALES_ORDER_SHIPMENT",
      soId: id,
    },
  });

  // Check low stock alerts
  if (result?.shippedProducts) {
    for (const item of result.shippedProducts) {
      await checkAndTriggerLowStockAlert({
        companyId: user.companyId!,
        productId: item.productId,
        decrementQuantity: item.quantity,
      });
    }
  }

  return { data: true };
}

export async function generateSalesInvoice(soId: string) {
  const user = await requireCompany();
  await requirePermission("sales:write");
  
  const so = await prisma.salesOrder.findUnique({
    where: { id: soId, companyId: user.companyId }
  });

  if (!so) throw new Error("Sales order not found");
  
  // Create an invoice for the full amount of the SO
  const invoice = await prisma.salesInvoice.create({
    data: {
      companyId: user.companyId,
      customerId: so.customerId,
      soId: so.id,
      invoiceNumber: generateInvoiceNumber(),
      amount: so.totalAmount,
      taxAmount: so.taxAmount,
      status: InvoiceStatus.UNPAID,
    }
  });

  revalidatePath("/sales");
  revalidatePath(`/sales/${soId}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "SalesOrder",
    entityId: invoice.id,
    details: `Generated sales invoice ${invoice.invoiceNumber} for SO ${so.soNumber || soId}`,
  });

  return { data: invoice };
}
