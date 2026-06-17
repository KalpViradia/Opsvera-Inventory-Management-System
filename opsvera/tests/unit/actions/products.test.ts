import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProducts, getProduct } from "../../../src/actions/products";
import { prisma } from "../../../src/lib/prisma";
import { requirePermission } from "../../../src/lib/rbac";

// Mock dependencies
vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("../../../src/lib/rbac", () => ({
  requirePermission: vi.fn(),
  requireCompany: vi.fn().mockResolvedValue({ companyId: "comp-123", id: "user-123", role: "ADMIN" }),
}));

describe("Product Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProducts()", () => {
    it("should require products:read permission", async () => {
      // Setup mock return
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getProducts();

      // Assert RBAC was checked
      expect(requirePermission).toHaveBeenCalledWith("products:read");
    });

    it("should return a list of products", async () => {
      const mockProducts = [
        { id: "1", name: "Widget A", sku: "WGT-A" },
        { id: "2", name: "Widget B", sku: "WGT-B" },
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(2);

      const result = await getProducts();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("getProduct()", () => {
    it("should require products:read permission", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      // This will throw because the product isn't found, but the RBAC check happens first
      await expect(getProduct("prod-123")).rejects.toThrow();

      expect(requirePermission).toHaveBeenCalledWith("products:read");
    });

    it("should return a specific product", async () => {
      const mockProduct = { id: "prod-123", name: "Specific Widget", sku: "SPC-WGT" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      
      // Need to mock customFieldValue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).customFieldValue = { findMany: vi.fn().mockResolvedValue([]) };

      const result = await getProduct("prod-123");

      expect(result).toEqual({ ...mockProduct, customFieldValues: [] });
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-123", companyId: "comp-123" },
        include: {
          category: true,
          unit: true,
          variants: true,
        },
      });
    });
  });
});
