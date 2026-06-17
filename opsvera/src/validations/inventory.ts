import { z } from "zod";
import { StockEntryType } from "@prisma/client";

export const createStockEntrySchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  type: z.nativeEnum(StockEntryType),
  fromLocationId: z.string().uuid("Invalid location ID").optional().nullable(),
  toLocationId: z.string().uuid("Invalid location ID").optional().nullable(),
  notes: z.string().optional().nullable(),
  unitCost: z.number().min(0).optional(),
  batchNumber: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
  serialNumbers: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.type === StockEntryType.RECEIPT && !data.toLocationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Destination location is required for receipts",
      path: ["toLocationId"],
    });
  }
  
  if (data.type === StockEntryType.DELIVERY && !data.fromLocationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Source location is required for deliveries",
      path: ["fromLocationId"],
    });
  }

  if (data.type === StockEntryType.TRANSFER) {
    if (!data.fromLocationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source location is required for transfers",
        path: ["fromLocationId"],
      });
    }
    if (!data.toLocationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination location is required for transfers",
        path: ["toLocationId"],
      });
    }
    if (data.fromLocationId && data.toLocationId && data.fromLocationId === data.toLocationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source and destination locations cannot be the same",
        path: ["toLocationId"],
      });
    }
  }
  
  if (data.type === StockEntryType.ADJUSTMENT && !data.fromLocationId && !data.toLocationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one location is required for adjustments",
      path: ["fromLocationId"],
    });
  }

  if (data.type === StockEntryType.SCRAP && !data.fromLocationId) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source location is required for scrap",
        path: ["fromLocationId"],
    });
  }
});

export type CreateStockEntryInput = z.infer<typeof createStockEntrySchema>;
