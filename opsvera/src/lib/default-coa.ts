import { prisma } from "@/lib/prisma";
import { AccountType } from "@prisma/client";

interface DefaultAccount {
  code: string;
  name: string;
  type: AccountType;
  isGroup: boolean;
  children?: DefaultAccount[];
}

export const DEFAULT_COA: DefaultAccount[] = [
  {
    code: "1000",
    name: "Current Assets",
    type: "ASSET",
    isGroup: true,
    children: [
      { code: "1010", name: "Cash", type: "ASSET", isGroup: false },
      { code: "1020", name: "Bank Account", type: "ASSET", isGroup: false },
      { code: "1030", name: "Accounts Receivable", type: "ASSET", isGroup: false },
      { code: "1040", name: "Inventory", type: "ASSET", isGroup: false },
      { code: "1050", name: "Prepaid Expenses", type: "ASSET", isGroup: false },
    ],
  },
  {
    code: "1500",
    name: "Fixed Assets",
    type: "ASSET",
    isGroup: true,
    children: [
      { code: "1510", name: "Equipment", type: "ASSET", isGroup: false },
      { code: "1520", name: "Accumulated Depreciation", type: "ASSET", isGroup: false },
    ],
  },
  {
    code: "2000",
    name: "Current Liabilities",
    type: "LIABILITY",
    isGroup: true,
    children: [
      { code: "2010", name: "Accounts Payable", type: "LIABILITY", isGroup: false },
      { code: "2020", name: "Accrued Expenses", type: "LIABILITY", isGroup: false },
      { code: "2030", name: "GST/VAT Payable", type: "LIABILITY", isGroup: false },
    ],
  },
  {
    code: "2500",
    name: "Long-Term Liabilities",
    type: "LIABILITY",
    isGroup: true,
    children: [
      { code: "2510", name: "Long-Term Loans", type: "LIABILITY", isGroup: false },
    ],
  },
  {
    code: "3000",
    name: "Equity",
    type: "EQUITY",
    isGroup: true,
    children: [
      { code: "3010", name: "Owner's Equity", type: "EQUITY", isGroup: false },
      { code: "3020", name: "Retained Earnings", type: "EQUITY", isGroup: false },
    ],
  },
  {
    code: "4000",
    name: "Income",
    type: "REVENUE",
    isGroup: true,
    children: [
      { code: "4010", name: "Sales Revenue", type: "REVENUE", isGroup: false },
      { code: "4020", name: "Service Revenue", type: "REVENUE", isGroup: false },
      { code: "4090", name: "Inventory Adjustment (Income)", type: "REVENUE", isGroup: false },
    ],
  },
  {
    code: "5000",
    name: "Expenses",
    type: "EXPENSE",
    isGroup: true,
    children: [
      { code: "5010", name: "Cost of Goods Sold", type: "EXPENSE", isGroup: false },
      { code: "5020", name: "Salaries & Wages", type: "EXPENSE", isGroup: false },
      { code: "5030", name: "Rent Expense", type: "EXPENSE", isGroup: false },
      { code: "5040", name: "Utilities", type: "EXPENSE", isGroup: false },
      { code: "5090", name: "Loss on Scrap", type: "EXPENSE", isGroup: false },
    ],
  },
];

export async function seedCompanyAccounts(companyId: string) {
  for (const group of DEFAULT_COA) {
    const createdGroup = await prisma.ledgerAccount.create({
      data: {
        companyId,
        code: group.code,
        name: group.name,
        type: group.type,
        isGroup: group.isGroup,
        isActive: true,
      },
    });

    if (group.children && group.children.length > 0) {
      await prisma.ledgerAccount.createMany({
        data: group.children.map((child) => ({
          companyId,
          code: child.code,
          name: child.name,
          type: child.type,
          isGroup: child.isGroup,
          parentId: createdGroup.id,
          isActive: true,
        })),
      });
    }
  }
}
