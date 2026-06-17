import { getCategories } from "@/actions/categories";
import { getUnits } from "@/actions/units";
import { PageShell } from "@/components/shared/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Package, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Catalog Settings | Opsvera",
  description: "Manage product categories and units of measurement",
};

export default async function CatalogSettingsPage() {
  const [categories, units] = await Promise.all([
    getCategories(),
    getUnits(),
  ]);

  return (
    <PageShell
      title="Catalog Settings"
      description="Manage the configuration for your product catalog including categories and units of measurement."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Categories Section */}
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Organize your products hierarchically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">{categories.length} Total Categories</span>
                <Button size="sm">Add Category</Button>
              </div>
              
              <div className="border rounded-md divide-y bg-card">
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No categories found.
                  </div>
                ) : (
                  categories.map((c) => (
                    <div key={c.id} className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units Section */}
        <Card>
          <CardHeader>
            <CardTitle>Units of Measure</CardTitle>
            <CardDescription>Define how your products are quantified (e.g., Pieces, Boxes, Kg).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted-foreground">{units.length} Total Units</span>
              <Button size="sm">Add Unit</Button>
            </div>
            
            <div className="border rounded-md divide-y bg-card">
              {units.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No units defined.
                </div>
              ) : (
                units.map((u) => (
                  <div key={u.id} className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{u.name}</p>
                    </div>
                    <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {u.code}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
