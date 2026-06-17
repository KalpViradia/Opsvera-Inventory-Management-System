import { getCategories } from "@/actions/categories";
import { getUnits } from "@/actions/units";
import { getCustomFields } from "@/actions/custom-fields";
import { getSuppliers } from "@/actions/suppliers";
import { ProductForm } from "@/components/products/product-form";

export const metadata = {
  title: "New Product | Opsvera",
  description: "Create a new product",
};

export default async function NewProductPage() {
  const [categories, units, customFieldsRes, suppliersRes] = await Promise.all([
    getCategories(),
    getUnits(),
    getCustomFields("products"),
    getSuppliers(),
  ]);

  return (
    <div className="p-4 md:p-8">
      <ProductForm 
        categories={categories} 
        units={units} 
        customFields={customFieldsRes.data || []} 
        suppliers={suppliersRes.data || []}
      />
    </div>
  );
}
