import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { POForm } from "@/components/purchases/po-form";
import { getSuppliers } from "@/actions/suppliers";
import { getProducts } from "@/actions/products";

export const metadata: Metadata = {
  title: "Create Purchase Order | Opsvera",
  description: "Create a new purchase order",
};

export default async function NewPurchaseOrderPage() {
  const [suppliersRes, productsRes] = await Promise.all([
    getSuppliers(),
    getProducts({ status: "ACTIVE" })
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Purchase Order</h2>
          <p className="text-muted-foreground mt-1">
            Fill in the details below to create a new draft purchase order.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl bg-card border rounded-lg p-6">
        <POForm 
          suppliers={JSON.parse(JSON.stringify(suppliersRes.data || []))} 
          products={JSON.parse(JSON.stringify(productsRes.data || []))} 
        />
      </div>
    </div>
  );
}
