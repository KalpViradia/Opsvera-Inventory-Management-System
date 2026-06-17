/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { requireMinimumRole } from "@/lib/rbac";
import { getAllCustomFields } from "@/actions/custom-fields";
import { CustomFieldBuilder } from "@/components/settings/custom-field-builder";

export const metadata: Metadata = {
  title: "Custom Fields | Opsvera",
  description: "Configure custom fields for your modules",
};

export default async function SettingsCustomFieldsPage() {
  await requireMinimumRole("admin");

  const res = await getAllCustomFields();
  const fields = res.data || [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Custom Fields</h2>
        <p className="text-muted-foreground mt-1">
          Configure industry-specific fields for your data models.
        </p>
      </div>

      <CustomFieldBuilder initialFields={fields as any} />
    </div>
  );
}
