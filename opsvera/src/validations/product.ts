import { z } from "zod";

// ============================================
// PRODUCT VALIDATION SCHEMAS
// Architecture planning — ready for implementation
// ============================================

/**
 * Schema for creating a new product.
 */
export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be less than 200 characters")
    .trim(),
  sku: z
    .string()
    .min(2, "SKU must be at least 2 characters")
    .max(50, "SKU must be less than 50 characters")
    .regex(
      /^[A-Za-z0-9\-_]+$/,
      "SKU can only contain letters, numbers, hyphens, and underscores"
    )
    .trim(),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().uuid("Invalid category"),
  unitId: z.string().uuid("Invalid unit of measurement"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  imageUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  minStockLevel: z.coerce
    .number()
    .int("Minimum stock level must be an integer")
    .min(0, "Minimum stock level must be non-negative")
    .default(0),
  reorderQuantity: z.coerce
    .number()
    .int("Reorder quantity must be an integer")
    .min(0, "Reorder quantity must be non-negative")
    .optional()
    .nullable(),
  preferredSupplierId: z.string().uuid("Invalid supplier ID").optional().nullable(),
  weight: z.coerce.number().min(0).optional().nullable(),
  length: z.coerce.number().min(0).optional().nullable(),
  width: z.coerce.number().min(0).optional().nullable(),
  height: z.coerce.number().min(0).optional().nullable(),
  isBundle: z.boolean().default(false),
  isBatchTracked: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "Variant name is required")
          .max(100),
        sku: z.string().max(50).optional().nullable(),
        price: z.coerce
          .number()
          .min(0, "Price must be non-negative")
          .max(999999999.99, "Price is too large"),
        cost: z.coerce
          .number()
          .min(0, "Cost must be non-negative")
          .max(999999999.99, "Cost is too large")
          .optional()
          .nullable(),
      })
    )
    .min(1, "At least one variant is required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Schema for updating an existing product.
 * All fields are optional (PATCH semantics).
 */
export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Schema for filtering/querying products.
 */
export const productFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "all"]).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

/**
 * Schema for creating a product category.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100)
    .trim(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Schema for creating a product unit.
 */
export const createUnitSchema = z.object({
  name: z
    .string()
    .min(1, "Unit name is required")
    .max(50)
    .trim(),
  code: z
    .string()
    .min(1, "Unit code is required")
    .max(10)
    .regex(/^[a-z0-9]+$/, "Code must be lowercase alphanumeric")
    .trim(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
