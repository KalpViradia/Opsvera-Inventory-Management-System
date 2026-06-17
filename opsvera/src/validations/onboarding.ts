import { z } from "zod";

// ============================================
// ONBOARDING VALIDATION SCHEMAS
// ============================================

/**
 * Industries available during onboarding.
 */
export const INDUSTRIES = [
  "Electronics",
  "Pharmaceuticals",
  "Apparel & Fashion",
  "Manufacturing",
  "Automotive",
  "Wholesale & Distribution",
  "Food & Beverage",
  "Construction & Building",
  "Healthcare",
  "Retail",
  "Agriculture",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

/**
 * Currencies supported.
 */
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
] as const;

/**
 * Timezones supported.
 */
export const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
] as const;

/**
 * Step 1: Company creation schema.
 */
export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters")
    .trim(),
  industry: z
    .string()
    .min(1, "Please select an industry"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

/**
 * Step 2: Team invite schema.
 */
export const teamInviteSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email("Please enter a valid email address"),
      role: z.enum(["admin", "manager", "staff", "viewer"], {
        message: "Please select a role",
      }),
    })
  ).optional().default([]),
});

export type TeamInviteInput = z.infer<typeof teamInviteSchema>;

/**
 * Step 3: Preferences schema.
 */
export const preferencesSchema = z.object({
  currency: z.string().min(1, "Please select a currency"),
  timezone: z.string().min(1, "Please select a timezone"),
  fiscalYearStart: z.number().min(1).max(12),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
