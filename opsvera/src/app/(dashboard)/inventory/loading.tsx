import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function InventoryLoading() {
  return <TableSkeleton title="Inventory" columns={5} rows={10} />;
}
