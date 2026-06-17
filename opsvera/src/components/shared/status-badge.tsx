import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "active"
  | "draft"
  | "archived"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "processing"
  | "overdue"
  | "submitted"
  | "received"
  | "closed";

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  draft: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  archived: "bg-gray-500/10 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  cancelled: "bg-gray-500/10 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  submitted: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  received: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  closed: "bg-gray-500/10 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700",
};

const dotColors: Record<StatusVariant, string> = {
  active: "bg-emerald-500",
  draft: "bg-gray-400",
  archived: "bg-gray-400",
  pending: "bg-amber-500",
  approved: "bg-blue-500",
  rejected: "bg-red-500",
  completed: "bg-emerald-500",
  cancelled: "bg-gray-400",
  processing: "bg-blue-500",
  overdue: "bg-red-500",
  submitted: "bg-violet-500",
  received: "bg-emerald-500",
  closed: "bg-gray-400",
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  showDot?: boolean;
  className?: string;
}

/**
 * Colored status badge with optional dot indicator.
 * Supports common ERP statuses: active, draft, pending, approved, etc.
 */
export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  if (!status) return null;

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs gap-1.5 px-2.5 py-0.5",
        variantStyles[status],
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[status])} />
      )}
      {displayLabel}
    </Badge>
  );
}
