import { getProduct } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { getUnits } from "@/actions/units";
import { getCustomFields } from "@/actions/custom-fields";
import { getSuppliers } from "@/actions/suppliers";
import { ProductForm } from "@/components/products/product-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Product | Opsvera",
  description: "Edit an existing product",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product, categories, units, customFieldsRes, suppliersRes;
  
  try {
    const [p, c, u, cf, s] = await Promise.all([
      getProduct(id),
      getCategories(),
      getUnits(),
      getCustomFields("products"),
      getSuppliers(),
    ]);
    product = p;
    categories = c;
    units = u;
    customFieldsRes = cf;
    suppliersRes = s;
  } catch {
    notFound();
  }

  return (
    <div className="p-4 md:p-8">
      <ProductForm 
        initialData={product} 
        categories={categories} 
        units={units} 
        customFields={customFieldsRes?.data || []}
        suppliers={suppliersRes?.data || []}
      />
    </div>
  );
}
