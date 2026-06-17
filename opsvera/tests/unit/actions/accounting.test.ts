import { describe, it, expect, vi, beforeEach } from "vitest";
import { getJournalEntries } from "../../../src/actions/accounting";
import { prisma } from "../../../src/lib/prisma";
import { requirePermission } from "../../../src/lib/rbac";

// Mock dependencies
vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    journalEntry: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("../../../src/lib/rbac", () => ({
  requirePermission: vi.fn(),
  requireCompany: vi.fn().mockResolvedValue({ companyId: "comp-123", id: "user-123", role: "ADMIN" }),
}));

describe("Accounting Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getJournalEntries()", () => {
    it("should require accounting:read permission", async () => {
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([]);

      await getJournalEntries();

      expect(requirePermission).toHaveBeenCalledWith("accounting:read");
    });

    it("should return a list of journals", async () => {
      const mockJournals = [
        { id: "j-1", entryNumber: "JE-001", totalAmount: 100 },
        { id: "j-2", entryNumber: "JE-002", totalAmount: 500 },
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockJournals as any);
      vi.mocked(prisma.journalEntry.count).mockResolvedValue(2);

      const result = await getJournalEntries();
      
      expect(result.data.entries).toEqual(mockJournals);
    });
  });
});
