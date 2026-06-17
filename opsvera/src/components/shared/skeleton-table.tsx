import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
}

/**
 * Table loading skeleton with configurable rows and columns.
 */
export function SkeletonTable({ columns = 5, rows = 5 }: SkeletonTableProps) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`r-${rowIndex}`}
          className="flex gap-4 p-4 border-b last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`c-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
