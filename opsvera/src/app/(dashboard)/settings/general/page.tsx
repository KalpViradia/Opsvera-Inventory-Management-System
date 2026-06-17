import { Metadata } from "next";
import { Building2, Globe, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { checkPermission, requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { EditCompanyForm } from "@/components/settings/edit-company-form";

export const metadata: Metadata = {
  title: "General Settings | Opsvera",
  description: "Company configuration and preferences",
};

async function getCompanySettings(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
  });
}

export default async function SettingsGeneralPage() {
  const user = await requirePermission("settings:read");
  const canEdit = checkPermission(user.role, "settings", "write");
  const company = await getCompanySettings(user.companyId!);

  if (!company) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">General Settings</h2>
        <p className="text-muted-foreground">Company not found.</p>
      </div>
    );
  }

  const settings = [
    {
      icon: Building2,
      label: "Company Name",
      value: company.name,
      description: "Your organization's display name",
    },
    {
      icon: Building2,
      label: "Industry",
      value: company.industry || "Not specified",
      description: "Primary business sector",
    },
    {
      icon: Building2,
      label: "Slug",
      value: company.slug,
      description: "Unique identifier for your company",
    },
    {
      icon: DollarSign,
      label: "Currency",
      value: company.currency,
      description: "Default currency for transactions",
    },
    {
      icon: Clock,
      label: "Timezone",
      value: company.timezone,
      description: "Used for scheduling and reports",
    },
    {
      icon: Globe,
      label: "Fiscal Year Start",
      value: new Date(0, company.fiscalYearStart - 1).toLocaleString("en", { month: "long" }),
      description: "First month of your fiscal year",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">General Settings</h2>
          <p className="text-muted-foreground mt-1">
            Company configuration and preferences.
          </p>
        </div>
        {canEdit && <EditCompanyForm company={company} />}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Company Information</CardTitle>
              <CardDescription>Basic details about your organization</CardDescription>
            </div>
            <Badge variant={company.onboardingCompleted ? "default" : "secondary"}>
              {company.onboardingCompleted ? "Active" : "Onboarding"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {settings.map((setting, index) => (
              <div key={setting.label}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <setting.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{setting.label}</p>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-right">{setting.value}</p>
                </div>
                {index < settings.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
          <CardDescription>When your account was created and last updated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
              <p className="text-sm font-medium mt-1">
                {new Date(company.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</p>
              <p className="text-sm font-medium mt-1">
                {new Date(company.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
