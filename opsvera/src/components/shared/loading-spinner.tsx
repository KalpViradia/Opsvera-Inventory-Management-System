import { cn } from "@/lib/utils";
import { Mark } from "@/components/shared/branding";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * Consistent loading spinner using the Opsvera logo mark.
 */
export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="animate-pulse">
        <Mark width={sizeMap[size]} height={sizeMap[size]} />
      </div>
      {label && (
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Full-page loading state for page transitions using the branded spinner.
 */
export function PageLoading({ label = "Loading Opsvera..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
