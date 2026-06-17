import { Metadata } from "next";
import { getSession } from "@/lib/rbac";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = {
  title: "My Profile | Opsvera",
  description: "Manage your personal profile",
};

export default async function ProfilePage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
