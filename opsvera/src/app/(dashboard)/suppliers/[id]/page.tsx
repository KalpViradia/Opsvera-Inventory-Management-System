import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SupplierDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: true,
      purchaseInvoices: true,
    }
  });

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{supplier.name}</h1>
        <Badge variant={supplier.isActive ? "default" : "secondary"}>
          {supplier.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Email:</strong> {supplier.email || "N/A"}</p>
            <p><strong>Phone:</strong> {supplier.phone || "N/A"}</p>
            <p><strong>Address:</strong> {supplier.address || "N/A"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
