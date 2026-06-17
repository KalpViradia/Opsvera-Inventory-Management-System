import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

/**
 * Card loading skeleton matching StatCard layout.
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
