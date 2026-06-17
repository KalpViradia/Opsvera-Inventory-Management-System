"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterBar } from "@/components/shared/filter-bar";
import { useCallback } from "react";

interface AuditFiltersProps {
  users: { id: string; name: string }[];
}

export function AuditFilters({ users }: AuditFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set("page", "1"); // Reset pagination on filter change
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (value: string) => {
    router.push(pathname + "?" + createQueryString("search", value));
  };

  const handleFilterChange = (key: string, value: string) => {
    router.push(pathname + "?" + createQueryString(key, value));
  };

  const handleClear = () => {
    router.push(pathname);
  };

  return (
    <FilterBar
      searchValue={searchParams.get("search") || ""}
      searchPlaceholder="Search audit details..."
      onSearchChange={handleSearch}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClear}
      activeFilters={{
        action: searchParams.get("action") || "",
        entityType: searchParams.get("entityType") || "",
        userId: searchParams.get("userId") || "",
      }}
      filters={[
        {
          key: "action",
          label: "Action",
          options: [
            { label: "Created", value: "CREATED" },
            { label: "Updated", value: "UPDATED" },
            { label: "Deleted", value: "DELETED" },
            { label: "Approved", value: "APPROVED" },
            { label: "Received", value: "RECEIVED" },
            { label: "Shipped", value: "SHIPPED" },
          ],
        },
        {
          key: "entityType",
          label: "Entity Type",
          options: [
            { label: "Product", value: "Product" },
            { label: "Supplier", value: "Supplier" },
            { label: "Customer", value: "Customer" },
            { label: "Purchase Order", value: "PurchaseOrder" },
            { label: "Sales Order", value: "SalesOrder" },
            { label: "Stock Level", value: "StockLevel" },
            { label: "Company", value: "Company" },
            { label: "User", value: "User" },
          ],
        },
        {
          key: "userId",
          label: "User",
          options: users.map((u) => ({ label: u.name, value: u.id })),
        },
      ]}
    />
  );
}
