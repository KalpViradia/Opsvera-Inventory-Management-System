import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function AccountingLoading() {
  return <TableSkeleton title="Accounting" columns={5} rows={8} />;
}
