"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { createCustomerSchema, updateCustomerSchema, type CreateCustomerInput, type UpdateCustomerInput } from "@/validations/customer";

export async function getCustomers() {
  const user = await requireCompany();
  await requirePermission("customers:read");

  try {
    const customers = await prisma.customer.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return JSON.parse(JSON.stringify({ data: customers }));
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

export async function getCustomerById(id: string) {
  const user = await requireCompany();
  await requirePermission("customers:read");

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const customFieldValues = await prisma.customFieldValue.findMany({
      where: { entityId: id },
      include: { field: true },
    });

    return JSON.parse(JSON.stringify({ data: { ...customer, customFieldValues } }));
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    throw new Error("Failed to fetch customer");
  }
}

export async function createCustomer(data: CreateCustomerInput) {
  const user = await requireCompany();
  await requirePermission("customers:write");

  const validatedData = createCustomerSchema.parse(data);

  try {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        companyId: user.companyId,
        name: validatedData.name,
      },
    });

    if (existingCustomer) {
      throw new Error("A customer with this name already exists");
    }

    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        priceListId: ("priceListId" in validatedData && validatedData.priceListId) ? validatedData.priceListId : null,
        companyId: user.companyId,
      },
    });

    revalidatePath("/customers");
    
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "CREATED",
      entityType: "Customer",
      entityId: customer.id,
      details: `Created customer "${validatedData.name}"`,
    });

    return { data: customer };
  } catch (error) {
    console.error("Failed to create customer:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create customer");
  }
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const user = await requireCompany();
  await requirePermission("customers:write");

  const validatedData = updateCustomerSchema.parse(data);

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (validatedData.name && validatedData.name !== customer.name) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          companyId: user.companyId,
          name: validatedData.name,
        },
      });

      if (existingCustomer) {
        throw new Error("A customer with this name already exists");
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...validatedData,
        priceListId: ("priceListId" in validatedData && validatedData.priceListId) ? validatedData.priceListId : null,
      },
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "UPDATED",
      entityType: "Customer",
      entityId: id,
      details: `Updated customer "${updatedCustomer.name}"`,
    });

    return { data: updatedCustomer };
  } catch (error) {
    console.error("Failed to update customer:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update customer");
  }
}

export async function deleteCustomer(id: string) {
  const user = await requireCompany();
  await requirePermission("customers:delete");

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            salesOrders: true,
            salesInvoices: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check for related records that would cause FK constraint errors
    if (customer._count.salesOrders > 0) {
      throw new Error("Cannot delete customer with existing sales orders. Deactivate instead.");
    }
    if (customer._count.salesInvoices > 0) {
      throw new Error("Cannot delete customer with existing invoices. Deactivate instead.");
    }

    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/customers");
    
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "DELETED",
      entityType: "Customer",
      entityId: id,
      details: `Deleted customer "${customer.name}"`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete customer.");
  }
}
