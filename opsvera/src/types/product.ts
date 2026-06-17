import { type Decimal } from "@prisma/client/runtime/library";

/**
 * Basic entity types representing the database models.
 * Used for generic typing across the application.
 */

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductUnit {
  id: string;
  name: string;
  code: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string | null;
  name: string;
  price: Decimal;
  cost: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  unitId: string;
  status: ProductStatus;
  minStockLevel: number;
  barcode: string | null;
  imageUrl: string | null;
  isBatchTracked: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Compound types for views and forms.
 */

export interface ProductWithRelations extends Product {
  category: ProductCategory;
  unit: ProductUnit;
  variants: ProductVariant[];
}

export interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
}
