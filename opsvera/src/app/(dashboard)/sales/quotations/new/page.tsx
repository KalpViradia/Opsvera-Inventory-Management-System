import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { QuotationForm } from "@/components/sales/quotation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "New Quotation | Opsvera",
  description: "Create a new sales quotation",
};

export default async function NewQuotationPage() {
  const user = await requireCompany();
  await requirePermission("sales:write");

  // Fetch necessary data for the form
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Quotation</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationForm 
            customers={JSON.parse(JSON.stringify(customers))} 
            products={JSON.parse(JSON.stringify(products))} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
