import { Metadata } from "next";
import { getCustomers } from "@/actions/customers";
import { getProducts } from "@/actions/products";
import { SOForm } from "@/components/sales/so-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create Sales Order | Opsvera",
  description: "Create a new sales order or quotation",
};

export default async function NewSalesOrderPage() {
  const [customersResponse, productsResponse] = await Promise.all([
    getCustomers(),
    getProducts(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Sales Order</h2>
          <p className="text-muted-foreground">
            Create a new quotation or sales order for a customer.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Enter the customer and line items for this order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SOForm 
            customers={JSON.parse(JSON.stringify(customersResponse.data || []))} 
            products={JSON.parse(JSON.stringify(productsResponse.data || []))} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
