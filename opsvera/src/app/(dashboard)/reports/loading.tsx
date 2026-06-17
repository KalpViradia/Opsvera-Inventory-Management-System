import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function ReportsLoading() {
  return <TableSkeleton title="Reports" columns={4} rows={6} />;
}
