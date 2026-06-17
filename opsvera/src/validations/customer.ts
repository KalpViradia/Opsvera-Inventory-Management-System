import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone cannot exceed 20 characters").optional().or(z.literal("")),
  address: z.string().max(500, "Address cannot exceed 500 characters").optional().or(z.literal("")),
  creditLimit: z.coerce.number().min(0, "Credit limit cannot be negative").optional(),
  paymentTerms: z.coerce.number().int().min(0, "Payment terms must be 0 or positive").optional(),
  taxId: z.string().max(50, "Tax ID cannot exceed 50 characters").optional().or(z.literal("")),
  priceListId: z.string().optional().or(z.literal("").transform(() => undefined)),
  isActive: z.boolean().default(true),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
