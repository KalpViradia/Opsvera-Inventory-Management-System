"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requireMinimumRole } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import {
  createCustomFieldSchema,
  updateCustomFieldSchema,
  saveCustomFieldValuesSchema,
  type CreateCustomFieldInput,
  type UpdateCustomFieldInput,
  type SaveCustomFieldValuesInput,
} from "@/validations/custom-field";
import { revalidatePath } from "next/cache";

/**
 * Get all active custom fields for a specific module
 */
export async function getCustomFields(moduleName: string) {
  try {
    const user = await requireCompany();
    
    const fields = await prisma.customField.findMany({
      where: {
        companyId: user.companyId,
        moduleName,
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return { data: fields };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get all custom fields (including inactive) for settings builder
 */
export async function getAllCustomFields() {
  try {
    const user = await requireCompany();
    await requireMinimumRole("admin"); // Only admin can build fields
    
    const fields = await prisma.customField.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: [
        { moduleName: "asc" },
        { displayOrder: "asc" },
      ],
    });

    return { data: fields };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Create a new custom field definition
 */
export async function createCustomField(input: CreateCustomFieldInput) {
  try {
    const user = await requireCompany();
    await requireMinimumRole("admin"); // Only admin can build fields

    const parsed = createCustomFieldSchema.parse(input);

    const existing = await prisma.customField.findUnique({
      where: {
        companyId_moduleName_fieldName: {
          companyId: user.companyId,
          moduleName: parsed.moduleName,
          fieldName: parsed.fieldName,
        },
      },
    });

    if (existing) {
      throw new Error(`Field '${parsed.fieldName}' already exists for module '${parsed.moduleName}'`);
    }

    // Determine default value based on type if missing
    let defaultValue = parsed.defaultValue;
    if (!defaultValue && parsed.isRequired) {
       if (parsed.fieldType === "checkbox") defaultValue = "false";
    }

    const field = await prisma.customField.create({
      data: {
        companyId: user.companyId,
        moduleName: parsed.moduleName,
        fieldName: parsed.fieldName,
        fieldType: parsed.fieldType,
        isRequired: parsed.isRequired,
        defaultValue,
        placeholder: parsed.placeholder,
        helpText: parsed.helpText,
        options: parsed.options || undefined,
        displayOrder: parsed.displayOrder,
        isActive: parsed.isActive,
      },
    });

    revalidatePath("/settings/custom-fields");

    try {
      await logActivity({
        userId: user.id,
        companyId: user.companyId,
        action: "CREATED",
        entityType: "CustomField",
        entityId: field.id,
        details: `Created custom field "${field.fieldName}" for ${field.moduleName}`,
      });
    } catch (e) {
      console.warn("Failed to log activity:", e);
    }

    return { data: field };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Update an existing custom field definition
 */
export async function updateCustomField(id: string, input: UpdateCustomFieldInput) {
  try {
    const user = await requireCompany();
    await requireMinimumRole("admin"); // Only admin can build fields

    const parsed = updateCustomFieldSchema.parse(input);

    const field = await prisma.customField.findUnique({
      where: { id, companyId: user.companyId },
    });

    if (!field) throw new Error("Custom field not found");

    const updated = await prisma.customField.update({
      where: { id },
      data: {
        ...parsed,
        options: parsed.options === null ? undefined : parsed.options,
      },
    });

    revalidatePath("/settings/custom-fields");

    try {
      await logActivity({
        userId: user.id,
        companyId: user.companyId,
        action: "UPDATED",
        entityType: "CustomField",
        entityId: updated.id,
        details: `Updated custom field "${updated.fieldName}"`,
      });
    } catch (e) {
      console.warn("Failed to log activity:", e);
    }

    return { data: updated };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Delete a custom field definition (also deletes all its values via CASCADE)
 */
export async function deleteCustomField(id: string) {
  try {
    const user = await requireCompany();
    await requireMinimumRole("admin"); 

    const field = await prisma.customField.findUnique({
      where: { id, companyId: user.companyId },
    });

    if (!field) throw new Error("Custom field not found");

    await prisma.customField.delete({ where: { id } });

    revalidatePath("/settings/custom-fields");

    try {
      await logActivity({
        userId: user.id,
        companyId: user.companyId,
        action: "DELETED",
        entityType: "CustomField",
        entityId: field.id,
        details: `Deleted custom field "${field.fieldName}"`,
      });
    } catch (e) {
      console.warn("Failed to log activity:", e);
    }

    return { data: { success: true } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Save custom field values for a specific entity
 */
export async function saveCustomFieldValues(input: SaveCustomFieldValuesInput) {
  try {
    const user = await requireCompany();
    const parsed = saveCustomFieldValuesSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      // First verify the entity belongs to company indirectly by verifying the fields
      for (const item of parsed.values) {
        const field = await tx.customField.findUnique({
          where: { id: item.fieldId, companyId: user.companyId },
        });

        if (!field) throw new Error(`Custom field ${item.fieldId} not found or access denied`);

        await tx.customFieldValue.upsert({
          where: {
            fieldId_entityId: {
              fieldId: item.fieldId,
              entityId: parsed.entityId,
            },
          },
          update: {
            value: item.value,
          },
          create: {
            fieldId: item.fieldId,
            entityId: parsed.entityId,
            value: item.value,
          },
        });
      }
    });

    return { data: { success: true } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
