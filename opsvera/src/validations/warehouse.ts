import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  address: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z
    .string()
    .refine((val) => !val || /^\d{10}$/.test(val), "Phone number must be exactly 10 digits")
    .optional()
    .nullable(),
  email: z
    .string()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

export const createLocationSchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  description: z.string().optional().nullable(),
  parentLocationId: z.string().uuid("Invalid parent location ID").optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial().omit({ warehouseId: true });

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
