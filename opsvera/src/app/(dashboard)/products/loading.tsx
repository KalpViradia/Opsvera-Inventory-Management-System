import { TableSkeleton } from "@/components/shared/loading-skeletons";

export default function ProductsLoading() {
  return <TableSkeleton title="Products" columns={5} rows={10} />;
}
