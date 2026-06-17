/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWarehouseById } from "@/actions/warehouses";
import { LocationTreeView } from "@/components/warehouses/location-tree";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, MapPin, Phone, Mail, User } from "lucide-react";
import Link from "next/link";

import { hasPermission, requirePermission } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Warehouse Details | Opsvera",
  description: "Manage warehouse zones and locations",
};

interface WarehouseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("inventory:read");
  const canWrite = await hasPermission("inventory:write");
  let warehouse;
  
  try {
    const resolvedParams = await params;
    const { data } = await getWarehouseById(resolvedParams.id);
    warehouse = data;
  } catch {
    notFound();
  }

  return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{warehouse.name}</h2>
              {!warehouse.isActive && (
                <Badge variant="secondary" className="font-normal">Inactive</Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              {warehouse.address || "No address provided"}
            </p>
          </div>
          
          <div className="ml-auto">
            {canWrite && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Warehouse</DialogTitle>
                  </DialogHeader>
                  <WarehouseForm initialData={warehouse} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Primary contacts for this location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manager / Contact</p>
                    <p className="text-muted-foreground">{warehouse.contactPerson || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{warehouse.phone || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{warehouse.email || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Summary</CardTitle>
                <CardDescription>Current inventory status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Stock tracking will be available in the Inventory module.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            { }
            <LocationTreeView warehouseId={warehouse.id} locations={warehouse.locations as any} />
          </div>
        </div>
      </div>
    );
}
