import { z } from "zod";

export const updateSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters")
    .trim(),
  industry: z.string().optional(),
  currency: z.string().min(1, "Please select a currency"),
  timezone: z.string().min(1, "Please select a timezone"),
  fiscalYearStart: z.number().min(1).max(12),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
