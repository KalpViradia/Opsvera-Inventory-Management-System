import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function WarehousesLoading() {
  return <TableSkeleton title="Warehouses" columns={4} rows={8} />;
}
