"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { createManualJournalEntry } from "@/actions/accounting";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";


export async function recordPayment(data: {
  invoiceId: string;
  invoiceType: "SALES" | "PURCHASE";
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  date: Date;
}) {
  const user = await requireCompany();
  await requirePermission("accounting:write");

  if (data.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get the invoice
    let invoice;
    if (data.invoiceType === "SALES") {
      invoice = await tx.salesInvoice.findUnique({ where: { id: data.invoiceId, companyId: user.companyId } });
    } else {
      invoice = await tx.purchaseInvoice.findUnique({ where: { id: data.invoiceId, companyId: user.companyId } });
    }

    if (!invoice) throw new Error("Invoice not found");

    const totalAmount = Number(invoice.amount);
    const paidAmount = Number(invoice.paidAmount);
    const remaining = totalAmount - paidAmount;

    if (data.amount > remaining + 0.01) {
      throw new Error(`Payment amount (${data.amount}) exceeds remaining balance (${remaining})`);
    }

    // 2. Create Payment Record
    const payment = await tx.payment.create({
      data: {
        companyId: user.companyId!,
        type: data.invoiceType === "SALES" ? "INCOMING" : "OUTGOING",
        invoiceType: data.invoiceType,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        paidAt: data.date,
        recordedBy: user.id,
      }
    });

    // 3. Update Invoice Status
    const newPaidAmount = paidAmount + data.amount;
    const isFullyPaid = newPaidAmount >= totalAmount - 0.01;
    const newStatus = isFullyPaid ? "PAID" : "PARTIAL";

    if (data.invoiceType === "SALES") {
      await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaidAmount, status: newStatus }
      });
    } else {
      await tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaidAmount, status: newStatus }
      });
    }

    return { payment, invoice };
  });

  // 4. Create Journal Entry (Outside transaction to reuse action, or we can inline it)
  // Find accounts
  const cashAccount = await prisma.ledgerAccount.findFirst({
    where: { companyId: user.companyId, type: "ASSET", name: { contains: "Cash", mode: "insensitive" } }
  }) || await prisma.ledgerAccount.findFirst({
    where: { companyId: user.companyId, type: "ASSET" }
  });

  if (!cashAccount) throw new Error("No asset account found to record payment.");

  if (data.invoiceType === "SALES") {
    const arAccount = await prisma.ledgerAccount.findFirst({
      where: { companyId: user.companyId, type: "ASSET", name: { contains: "Receivable", mode: "insensitive" } }
    }) || await prisma.ledgerAccount.findFirst({
      where: { companyId: user.companyId, type: "ASSET", id: { not: cashAccount.id } }
    });

    if (arAccount) {
      await createManualJournalEntry({
        date: data.date,
        narration: `Payment received for Sales Invoice ${data.invoiceId}`,
        items: [
          { accountId: cashAccount.id, debit: data.amount, credit: 0, narration: "Cash Receipt" },
          { accountId: arAccount.id, debit: 0, credit: data.amount, narration: "A/R Reduction" },
        ]
      });
    }
  } else {
    const apAccount = await prisma.ledgerAccount.findFirst({
      where: { companyId: user.companyId, type: "LIABILITY", name: { contains: "Payable", mode: "insensitive" } }
    }) || await prisma.ledgerAccount.findFirst({
      where: { companyId: user.companyId, type: "LIABILITY" }
    });

    if (apAccount) {
      await createManualJournalEntry({
        date: data.date,
        narration: `Payment made for Purchase Invoice ${data.invoiceId}`,
        items: [
          { accountId: apAccount.id, debit: data.amount, credit: 0, narration: "A/P Reduction" },
          { accountId: cashAccount.id, debit: 0, credit: data.amount, narration: "Cash Disbursement" },
        ]
      });
    }
  }

  await logActivity({
    userId: user.id,
    companyId: user.companyId!,
    action: "CREATED",
    entityType: "Payment",
    entityId: result.payment.id,
    details: `Recorded ${data.method} payment of ${data.amount} for ${data.invoiceType} invoice`,
  });

  if (data.invoiceType === "SALES") {
    revalidatePath(`/sales/invoices/${data.invoiceId}`);
    revalidatePath("/sales/invoices");
  } else {
    revalidatePath(`/purchases/invoices/${data.invoiceId}`);
    revalidatePath("/purchases/invoices");
  }

  return { success: true };
}
