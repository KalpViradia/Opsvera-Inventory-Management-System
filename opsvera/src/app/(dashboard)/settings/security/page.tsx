import { Metadata } from "next";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TwoFactorManager } from "@/components/settings/two-factor-manager";

export const metadata: Metadata = {
  title: "Security Settings | Opsvera",
  description: "Manage your account security and two-factor authentication",
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Security
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and authentication methods.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring more than just a password to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorManager />
        </CardContent>
      </Card>
    </div>
  );
}
