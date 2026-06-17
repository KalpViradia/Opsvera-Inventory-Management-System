import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  paymentTerms: z.coerce.number().min(0, "Payment terms cannot be negative").optional(),
  taxId: z.string().optional().or(z.literal("")),
  bankDetails: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(1).max(5).optional(),
  isActive: z.boolean().default(true),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
