"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Box, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

type WarehouseWithCount = Prisma.WarehouseGetPayload<{
  include: {
    _count: {
      select: { locations: true }
    }
  }
}>;

interface WarehouseCardProps {
  warehouse: WarehouseWithCount;
}

export function WarehouseCard({ warehouse }: WarehouseCardProps) {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md border-border/50 bg-card">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {warehouse.name}
              {!warehouse.isActive && (
                <Badge variant="secondary" className="ml-2 font-normal">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center mt-2 line-clamp-1">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              {warehouse.address || "No address provided"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="space-y-3 text-sm">
          {warehouse.contactPerson && (
            <div className="flex items-center text-muted-foreground">
              <span className="font-medium text-foreground mr-2">Contact:</span> 
              {warehouse.contactPerson}
            </div>
          )}
          
          {(warehouse.phone || warehouse.email) && (
            <div className="flex flex-col gap-1.5 text-muted-foreground">
              {warehouse.phone && (
                <div className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2 shrink-0" />
                  {warehouse.phone}
                </div>
              )}
              {warehouse.email && (
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-2 shrink-0" />
                  {warehouse.email}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex justify-between items-center text-muted-foreground">
            <div className="flex items-center">
              <Box className="h-4 w-4 mr-2" />
              <span>{warehouse._count.locations} Locations</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full justify-between group">
          <Link href={`/warehouses/${warehouse.id}`}>
            Manage Warehouse
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
