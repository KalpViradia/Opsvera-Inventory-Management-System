"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MoreHorizontal, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusVariant } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProduct } from "@/actions/products";
import { exportProductsCSV } from "@/actions/export";
import { importProductsCSV } from "@/actions/import";
import { CSVExportButton } from "@/components/shared/csv-export-button";
import { CSVImportDialog } from "@/components/shared/csv-import-dialog";
import { ExportButton } from "@/components/shared/export-button";
import type { ProductWithRelations } from "@/types/product";

export function ProductListClient({ data, canWrite }: { data: ProductWithRelations[], canWrite: boolean }) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        toast.success("Product deleted successfully");
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message || "Something went wrong");
      }
    }
  };

  const excelData = data.map((p) => ({
    SKU: p.sku,
    Barcode: p.barcode || "",
    Name: p.name,
    Category: p.category?.name || "",
    Status: p.status,
    "Min Stock": p.minStockLevel || 0,
    Variants: p.variants?.length || 0,
  }));

  const columns: ColumnDef<ProductWithRelations>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <div className="font-medium">{row.original.sku}</div>,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.imageUrl ? (
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden border relative">
              <Image src={row.original.imageUrl} alt={row.original.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center border shrink-0">
              <Package className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm leading-none mb-1">{row.original.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {row.original.variants.length} variant{row.original.variants.length !== 1 && "s"}
              </p>
              {row.original.isBatchTracked && (
                <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Batch Tracked
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => <div>{row.original.category?.name || "Uncategorized"}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status.toLowerCase() as StatusVariant} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        if (!canWrite) return null;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(product.sku)}
              >
                Copy SKU
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* We would render FilterBar here, but DataTable currently handles basic search */}
        <div className="flex items-center gap-2">
          {/* Future FilterBar integration */}
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <CSVImportDialog 
                importAction={importProductsCSV} 
                templateHeaders={["SKU", "Name", "Description", "Category", "Unit", "Status", "Min Stock", "Price", "Cost"]} 
                title="Import Products"
                description="Upload a CSV file to bulk import products."
              />
              <CSVExportButton exportAction={exportProductsCSV} filename="products_export" />
              <ExportButton data={excelData} filename="Opsvera_Products_List" sheetName="Products" />
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Filter products..."
      />
    </div>
  );
}
