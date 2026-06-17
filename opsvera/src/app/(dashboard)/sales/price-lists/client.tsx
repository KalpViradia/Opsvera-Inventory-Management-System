"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PriceListWithCounts = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  _count: { items: number; customers: number };
};

export function PriceListsClient({ initialData }: { initialData: PriceListWithCounts[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialData.filter((list) =>
    list.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search price lists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
        <Button onClick={() => toast.info("Price List creation is under development and will be available soon.")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Price List
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((list) => (
          <Card key={list.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tags className="w-4 h-4 text-primary" />
                  {list.name}
                </CardTitle>
                <Badge variant={list.isActive ? "default" : "secondary"} className={list.isActive ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" : ""}>
                  {list.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {list.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <span>{list._count.items} items</span>
                  <span>{list._count.customers} customers</span>
                </div>
                <span className="font-medium text-foreground">{list.currency}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
            <Tags className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No price lists found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              You haven&apos;t created any price lists yet, or no lists match your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
