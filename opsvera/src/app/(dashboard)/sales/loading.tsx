import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function SalesLoading() {
  return <TableSkeleton title="Sales Orders" columns={6} rows={10} />;
}
