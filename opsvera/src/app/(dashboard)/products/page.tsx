/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProducts } from "@/actions/products";
import { ProductListClient } from "./client";
import { PageShell } from "@/components/shared/page-shell";
import { hasPermission, requirePermission } from "@/lib/rbac";

export const metadata = {
  title: "Products | Opsvera",
  description: "Manage your product catalog",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requirePermission("products:read");
  const canWrite = await hasPermission("products:write");

  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
   
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status as any : undefined;
  const categoryId = typeof resolvedParams.categoryId === "string" ? resolvedParams.categoryId : undefined;

  const result = await getProducts({
    page,
    search,
    status,
    categoryId,
    limit: 50,
  });

  const serializedData = result.data.map((product: any) => ({
    ...product,
    averageCost: product.averageCost ? Number(product.averageCost) : 0,
    weight: product.weight ? Number(product.weight) : null,
    length: product.length ? Number(product.length) : null,
    width: product.width ? Number(product.width) : null,
    height: product.height ? Number(product.height) : null,
    variants: product.variants?.map((v: any) => ({
      ...v,
      price: v.price ? Number(v.price) : 0,
      cost: v.cost ? Number(v.cost) : 0,
    })),
  })) as any;

  return (
    <PageShell
      title="Products"
      description="Manage your product catalog, variants, and pricing."
    >
      <ProductListClient data={serializedData} canWrite={canWrite} />
    </PageShell>
  );
}
