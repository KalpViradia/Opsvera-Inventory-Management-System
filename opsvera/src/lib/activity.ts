import { prisma } from "@/lib/prisma";

// ============================================
// ACTIVITY LOGGING UTILITY
// ============================================

/**
 * Activity actions that can be recorded.
 * Matches the badge styles in the Audit Log UI.
 */
export type ActivityAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "APPROVED"
  | "RECEIVED"
  | "SHIPPED"
  | "CONFIRMED"
  | "TRANSFER"
  | "CANCELLED";

/**
 * Entity types tracked in the system.
 */
export type EntityType =
  | "Product"
  | "Supplier"
  | "Customer"
  | "PurchaseOrder"
  | "SalesOrder"
  | "Warehouse"
  | "Location"
  | "StockEntry"
  | "Category"
  | "Unit"
  | "Company"
  | "User"
  | "JournalEntry"
  | "LedgerAccount"
  | "CustomField"
  | "Role"
  | "RolePermission"
  | "Payment"
  | "Quotation"
  | "SalesInvoice"
  | "PurchaseInvoice"
  | "Batch";

interface LogActivityParams {
  userId: string;
  companyId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  details?: string;
}

/**
 * Log an activity record for the audit trail.
 *
 * This is a fire-and-forget operation — it never throws.
 * Activity logging should not break the main operation if it fails.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ?? null,
      },
    });
  } catch (error) {
    // Log but don't throw — activity logging is non-critical
    console.error("[Activity] Failed to log activity:", error);
  }
}
