import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function CustomersLoading() {
  return <TableSkeleton title="Customers" columns={4} rows={10} />;
}
