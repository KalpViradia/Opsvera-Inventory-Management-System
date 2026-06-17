import { z } from "zod";
import { POStatus } from "@prisma/client";

export const purchaseOrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100").default(0),
});

export const createPOSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  poNumber: z.string().optional(), // Auto-generated if not provided
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "RECEIVED", "CLOSED", "CANCELLED"]).default("DRAFT"),
  notes: z.string().optional(),
  currency: z.string().default("USD"),
  exchangeRate: z.coerce.number().min(0.000001).default(1),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one line item is required"),
});

export const updatePOStatusSchema = z.object({
  status: z.nativeEnum(POStatus),
  notes: z.string().optional(),
});

export const receivePOItemSchema = z.object({
  id: z.string().min(1, "Line item ID is required"),
  receiveQty: z.coerce.number().int().min(1, "Receive quantity must be at least 1"),
});

export const receivePOSchema = z.object({
  locationId: z.string().min(1, "Destination location is required"),
  notes: z.string().optional(),
  items: z.array(receivePOItemSchema).min(1, "At least one item must be received"),
});
