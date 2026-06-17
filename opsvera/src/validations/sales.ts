import { z } from "zod";
import { SOStatus } from "@prisma/client";

export const salesOrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100").default(0),
});

export const createSOSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  soNumber: z.string().optional(), // Auto-generated if not provided
  status: z.nativeEnum(SOStatus).default(SOStatus.DRAFT),
  notes: z.string().optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  currency: z.string().default("USD"),
  exchangeRate: z.coerce.number().min(0.000001).default(1),
  items: z.array(salesOrderItemSchema).min(1, "At least one line item is required"),
});

export const updateSOStatusSchema = z.object({
  status: z.nativeEnum(SOStatus),
  notes: z.string().optional(),
});

export const shipSOItemSchema = z.object({
  id: z.string().min(1, "Line item ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const shipSOSchema = z.object({
  locationId: z.string().min(1, "Source location is required"),
  notes: z.string().optional(),
  items: z.array(shipSOItemSchema).min(1, "At least one item must be shipped"),
});

export const quotationItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100").default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  currency: z.string().default("USD"),
  validUntil: z.coerce.date(),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "At least one line item is required"),
});
