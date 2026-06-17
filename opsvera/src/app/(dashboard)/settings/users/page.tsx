import { Metadata } from "next";
import { ShieldCheck, Mail, Users, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkPermission, requireMinimumRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { UserRoleSelect } from "@/components/settings/user-role-select";
import { DeactivateUserButton } from "@/components/settings/deactivate-user-button";
import { InviteUserDialog } from "@/components/settings/invite-user-dialog";
import { getPendingInvitations } from "@/actions/invitations";
import { PendingInviteButton } from "@/components/settings/pending-invite-button";
import { getCompanyRoles } from "@/actions/roles";
import { RolePermissionEditor } from "@/components/settings/role-permission-editor";

export const metadata: Metadata = {
  title: "Users & Roles | Opsvera",
  description: "Manage system users and access roles",
};

async function getUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
}

export default async function SettingsUsersPage() {
  const currentUser = await requireMinimumRole("admin");
  const canEditUsers = checkPermission(currentUser.role, "users", "write");
  const canDeleteUsers = checkPermission(currentUser.role, "users", "delete");
  const users = await getUsers(currentUser.companyId!);
  const roles = await getCompanyRoles();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users & Roles</h2>
          <p className="text-muted-foreground mt-1">
            Manage who has access to your company account.
          </p>
        </div>
        <InviteUserDialog disabled={!canEditUsers} />
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Active Users
              </CardTitle>
              <CardDescription>
                All users currently registered to your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.id === currentUser.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <UserRoleSelect
                          userId={user.id}
                          currentRole={user.role || ""}
                          isCurrentUser={user.id === currentUser.id}
                          canEdit={canEditUsers}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DeactivateUserButton
                          userId={user.id}
                          userName={user.name || user.email}
                          disabled={!canDeleteUsers || user.id === currentUser.id || user.role === "owner"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <PendingInvitationsSection />
        </TabsContent>

        <TabsContent value="roles">
          <RolePermissionEditor roles={roles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function PendingInvitationsSection() {
  const invitations = await getPendingInvitations();

  if (invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Users who have been invited but haven&apos;t joined yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell className="capitalize">{invite.role}</TableCell>
                <TableCell>
                  {new Date(invite.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span className={invite.expiresAt < new Date() ? "text-destructive" : ""}>
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <PendingInviteButton inviteId={invite.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

