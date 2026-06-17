import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function PurchasesLoading() {
  return <TableSkeleton title="Purchase Orders" columns={6} rows={10} />;
}
