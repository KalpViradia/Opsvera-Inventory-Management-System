import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Loading content...</p>
      </div>
    </div>
  );
}
