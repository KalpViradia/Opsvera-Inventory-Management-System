import { z } from "zod";

export const createCustomFieldSchema = z.object({
  moduleName: z.enum(["products", "customers", "suppliers"]),
  fieldName: z.string().min(2, "Field name must be at least 2 characters"),
  fieldType: z.enum(["text", "number", "date", "dropdown", "checkbox"]),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().optional().nullable(),
  placeholder: z.string().optional().nullable(),
  helpText: z.string().optional().nullable(),
  options: z.array(z.string()).optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCustomFieldSchema = createCustomFieldSchema.partial();

export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;

// For saving entity values
export const customFieldValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.string(),
});

export const saveCustomFieldValuesSchema = z.object({
  entityId: z.string().uuid(),
  values: z.array(customFieldValueSchema),
});

export type SaveCustomFieldValuesInput = z.infer<typeof saveCustomFieldValuesSchema>;
