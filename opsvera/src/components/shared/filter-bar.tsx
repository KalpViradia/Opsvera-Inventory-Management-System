"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

/**
 * Reusable filter bar with search input, filter dropdowns, and active filter badges.
 * Used across all list/table views.
 */
export function FilterBar({
  searchValue = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  className,
}: FilterBarProps) {
  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v && v !== "all"
  ).length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 h-9"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {filters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={activeFilters[filter.key] || "all"}
                onValueChange={(val) => onFilterChange?.(filter.key, val)}
              >
                <SelectTrigger className="h-9 w-auto min-w-[120px] text-sm">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {Object.entries(activeFilters)
            .filter(([, v]) => v && v !== "all")
            .map(([key, value]) => {
              const filterConfig = filters.find((f) => f.key === key);
              const option = filterConfig?.options.find(
                (o) => o.value === value
              );
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1 pr-1 cursor-pointer hover:bg-muted"
                  onClick={() => onFilterChange?.(key, "all")}
                >
                  {filterConfig?.label}: {option?.label || value}
                  <X className="w-3 h-3" />
                </Badge>
              );
            })}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground px-2"
            onClick={onClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
