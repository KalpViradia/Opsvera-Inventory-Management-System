import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Generic fallback loading skeleton for any dashboard page that
 * doesn't have its own loading.tsx. Shows a page header + content card.
 */
export default function DashboardFallbackLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Content area */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-56 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-5 flex-1"
                  style={{ opacity: 1 - i * 0.1 }}
                />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
