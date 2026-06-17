"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileForm({ user }: { user?: { name?: string | null, email?: string | null, image?: string | null, role?: string | null, companyId?: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (n?: string) => {
    if (!n) return "U";
    return n
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
      });
      if (error) {
        toast.error(error.message || "Failed to update profile");
      } else {
        toast.success("Profile updated successfully");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border">
              <AvatarImage {...(user?.image ? { src: user.image } : {})} alt={user?.name || "Avatar"} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              {user?.role && (
                <div className="mt-1 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase text-primary bg-primary/5">
                  {user.role}
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Assigned Role</Label>
              <Input
                id="role"
                value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "None"}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={user?.companyId || "None"}
                disabled
                className="bg-muted/50 font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-end">
          <Button type="submit" disabled={isSaving || name.trim() === user?.name}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
