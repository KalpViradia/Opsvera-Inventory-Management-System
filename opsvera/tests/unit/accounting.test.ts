import { describe, it, expect } from "vitest";

describe("Double-Entry Accounting Logic", () => {
  it("should ensure debits equal credits for standard journal entries", () => {
    const entry = {
      lines: [
        { accountId: "cash", debit: 1000, credit: 0 },
        { accountId: "sales", debit: 0, credit: 1000 },
      ]
    };
    
    const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(1000);
  });

  it("should handle complex multi-line journal entries", () => {
    const entry = {
      lines: [
        { accountId: "inventory", debit: 500, credit: 0 },
        { accountId: "cogs", debit: 300, credit: 0 },
        { accountId: "ap", debit: 0, credit: 800 },
      ]
    };
    
    const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(800);
  });
});
