/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireMinimumRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AuditFilters } from "./audit-filters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit Log | Opsvera",
  description: "System activity and audit trail",
};

async function getAuditLogs(companyId: string, searchParams: Record<string, string | string[] | undefined>) {
  const page = Number(searchParams.page) || 1;
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: Prisma.ActivityWhereInput = {
    companyId,
  };

  if (searchParams.action) {
    where.action = String(searchParams.action);
  }
  if (searchParams.entityType) {
    where.entityType = String(searchParams.entityType);
  }
  if (searchParams.userId) {
    where.userId = String(searchParams.userId);
  }
  if (searchParams.search) {
    where.details = {
      contains: String(searchParams.search),
      mode: "insensitive",
    };
  }

  const [total, data] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async function getCompanyUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });
}

function actionBadge(action: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
    CREATED: { variant: "default" },
    UPDATED: { variant: "secondary" },
    DELETED: { variant: "destructive" },
    APPROVED: { variant: "outline" },
    RECEIVED: { variant: "outline" },
    SHIPPED: { variant: "outline" },
    TRANSFER: { variant: "secondary" },
  };

  const config = variants[action] || { variant: "secondary" };
  return <Badge variant={config.variant} className="text-xs">{action}</Badge>;
}

export default async function SettingsAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currentUser = await requireMinimumRole("admin");
  const { data: logs, total, page, totalPages } = await getAuditLogs(currentUser.companyId!, params);
  const users = await getCompanyUsers(currentUser.companyId!);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-muted-foreground mt-1">
            System activity and comprehensive audit trail.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-primary" />
                Activity Log
              </CardTitle>
              <CardDescription>
                Showing {total === 0 ? 0 : (page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total} events.
              </CardDescription>
            </div>
          </div>
          <div className="pt-4">
            <AuditFilters users={users.map((u: any) => ({ id: u.id, name: u.name || "Unknown User" }))} />
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              No activity logs found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.user.name}</span>
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{actionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm">{log.entityType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={log.details || ""}>
                      {log.details || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="text-sm text-muted-foreground mr-4">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`?${new URLSearchParams({ ...params as any, page: String(page - 1) }).toString()}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <><ChevronLeft className="h-4 w-4" /></>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`?${new URLSearchParams({ ...params as any, page: String(page + 1) }).toString()}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <><ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
