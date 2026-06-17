import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function SuppliersLoading() {
  return <TableSkeleton title="Suppliers" columns={4} rows={10} />;
}
