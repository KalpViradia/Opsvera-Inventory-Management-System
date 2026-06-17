"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function getChartOfAccounts() {
  const user = await requireCompany();
  await requirePermission("accounting:read");

  const accounts = await prisma.ledgerAccount.findMany({
    where: { companyId: user.companyId },
    orderBy: { code: "asc" },
    include: {
      children: {
        orderBy: { code: "asc" },
      },
    },
  });

  // Group logically for the tree view
  const rootAccounts = accounts.filter((a) => !a.parentId);
  return { data: rootAccounts };
}

export async function createLedgerAccount(data: {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId?: string;
  isGroup?: boolean;
}) {
  const user = await requireCompany();
  await requirePermission("accounting:write");

  // Verify unique code
  const existing = await prisma.ledgerAccount.findUnique({
    where: { companyId_code: { companyId: user.companyId, code: data.code } },
  });
  if (existing) {
    throw new Error(`Account code ${data.code} is already in use`);
  }

  const account = await prisma.ledgerAccount.create({
    data: {
      ...data,
      companyId: user.companyId,
    },
  });

  revalidatePath("/accounting/coa");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "LedgerAccount",
    entityId: account.id,
    details: `Created ledger account: ${data.code} - ${data.name}`,
  });

  return { data: account };
}

export async function getJournalEntries(skip = 0, take = 25) {
  const user = await requireCompany();
  await requirePermission("accounting:read");

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: "desc" },
      skip,
      take,
      include: {
        items: {
          include: {
            account: true,
          },
        },
      },
    }),
    prisma.journalEntry.count({
      where: { companyId: user.companyId },
    }),
  ]);

  return { data: { entries, total } };
}

export async function createManualJournalEntry(data: {
  date: Date;
  narration: string;
  items: { accountId: string; debit: number; credit: number; narration?: string }[];
}) {
  const user = await requireCompany();
  await requirePermission("accounting:write");

  // Validate debits = credits
  const totalDebit = data.items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = data.items.reduce((sum, item) => sum + item.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal entry must balance. Debits: ${totalDebit}, Credits: ${totalCredit}`);
  }
  
  if (totalDebit <= 0) {
    throw new Error("Journal entry must have a value > 0");
  }

  // Generate an entry number
  const count = await prisma.journalEntry.count({ where: { companyId: user.companyId } });
  const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const journal = await prisma.$transaction(async (tx) => {
    // Create the header
    const entry = await tx.journalEntry.create({
      data: {
        companyId: user.companyId,
        entryNumber,
        date: data.date,
        narration: data.narration,
        refType: "MANUAL",
        totalAmount: totalDebit,
        createdBy: user.id,
        items: {
          create: data.items.map((item) => ({
            accountId: item.accountId,
            debit: item.debit,
            credit: item.credit,
            narration: item.narration,
          })),
        },
      },
    });

    // Update account balances
    for (const item of data.items) {
      if (item.debit > 0 || item.credit > 0) {
        const account = await tx.ledgerAccount.findUnique({ where: { id: item.accountId } });
        if (!account) continue;

        let balanceChange = 0;
        // Normal balance for ASSET/EXPENSE is Debit (+). Normal balance for LIAB/EQ/REV is Credit (+)
        if (account.type === "ASSET" || account.type === "EXPENSE") {
          balanceChange = item.debit - item.credit;
        } else {
          balanceChange = item.credit - item.debit;
        }

        await tx.ledgerAccount.update({
          where: { id: account.id },
          data: { balance: { increment: balanceChange } },
        });
      }
    }

    return entry;
  });

  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/reports");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "JournalEntry",
    entityId: journal.id,
    details: `Created manual journal entry ${entryNumber} for ${totalDebit}`,
  });

  return { data: journal };
}

export async function getAccountingOverview() {
  try {
    const user = await requireCompany();
    await requirePermission("accounting:read");

    const [purchaseInvoices, salesInvoices] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where: { companyId: user.companyId },
        include: {
          supplier: { select: { name: true } },
          po: { select: { poNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.salesInvoice.findMany({
        where: { companyId: user.companyId },
        include: {
          customer: { select: { name: true } },
          so: { select: { soNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Compute aggregates
    let totalPayable = 0;
    let totalPaid = 0;
    let totalReceivable = 0;
    let totalReceived = 0;

    for (const inv of purchaseInvoices) {
      const amount = Number(inv.amount);
      const paid = Number(inv.paidAmount);
      totalPayable += amount;
      totalPaid += paid;
    }

    for (const inv of salesInvoices) {
      const amount = Number(inv.amount);
      const received = Number(inv.paidAmount);
      totalReceivable += amount;
      totalReceived += received;
    }

    return {
      data: {
        purchaseInvoices,
        salesInvoices,
        summary: {
          totalPayable,
          totalPaid,
          outstandingPayable: totalPayable - totalPaid,
          totalReceivable,
          totalReceived,
          outstandingReceivable: totalReceivable - totalReceived,
        },
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch accounting data",
    };
  }
}

export async function getFinancialReports(startDate?: Date, endDate?: Date) {
  const user = await requireCompany();
  await requirePermission("accounting:read");

  // Fetch all accounts
  const accounts = await prisma.ledgerAccount.findMany({
    where: { companyId: user.companyId },
  });

  // Fetch all journal items within the date range
  const journalItems = await prisma.journalItem.findMany({
    where: {
      account: { companyId: user.companyId },
      journalEntry: {
        ...(startDate || endDate ? {
          date: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          }
        } : {}),
        isPosted: true,
      },
    },
    include: {
      account: true,
    },
  });

  // Aggregate by account type
  const balances = {
    ASSET: 0,
    LIABILITY: 0,
    EQUITY: 0,
    REVENUE: 0,
    EXPENSE: 0,
  };

  const accountBalances = new Map<string, { id: string; name: string; type: string; code: string; balance: number; debit: number; credit: number }>();

  for (const acc of accounts) {
    if (!acc.isGroup) {
      accountBalances.set(acc.id, { id: acc.id, name: acc.name, type: acc.type, code: acc.code, balance: 0, debit: 0, credit: 0 });
    }
  }

  for (const item of journalItems) {
    const acc = accountBalances.get(item.accountId);
    if (!acc) continue;

    const debit = Number(item.debit) || 0;
    const credit = Number(item.credit) || 0;

    acc.debit += debit;
    acc.credit += credit;

    let balanceChange = 0;
    if (acc.type === "ASSET" || acc.type === "EXPENSE") {
      balanceChange = debit - credit;
    } else {
      balanceChange = credit - debit;
    }

    acc.balance += balanceChange;
    balances[acc.type as keyof typeof balances] += balanceChange;
  }

  const netIncome = balances.REVENUE - balances.EXPENSE;
  // Total Equity = Base Equity + Net Income
  const totalEquity = balances.EQUITY + netIncome;
  
  // Sort account details by code
  const accountDetails = Array.from(accountBalances.values())
    .filter(a => a.balance !== 0 || a.debit !== 0 || a.credit !== 0)
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    data: {
      balances,
      netIncome,
      totalAssets: balances.ASSET,
      totalLiabilities: balances.LIABILITY,
      totalEquity,
      isBalanced: Math.abs(balances.ASSET - (balances.LIABILITY + totalEquity)) < 0.01,
      accountDetails,
      totalDebits: accountDetails.reduce((sum, a) => sum + a.debit, 0),
      totalCredits: accountDetails.reduce((sum, a) => sum + a.credit, 0),
    },
  };
}
