import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesOrders: true,
      salesInvoices: true,
    }
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{customer.name}</h1>
        <Badge variant={customer.isActive ? "default" : "secondary"}>
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Email:</strong> {customer.email || "N/A"}</p>
            <p><strong>Phone:</strong> {customer.phone || "N/A"}</p>
            <p><strong>Address:</strong> {customer.address || "N/A"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
