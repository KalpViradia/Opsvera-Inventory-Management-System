"use server";

import { prisma } from "@/lib/prisma";
import { requireMinimumRole, checkPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { sendEmail, buildInviteEmailHTML } from "@/lib/email";

export async function createInvitation(data: { email: string; role: string }) {
  const user = await requireMinimumRole("admin");
  const canInvite = checkPermission(user.role, "users", "write");
  
  if (!canInvite) throw new Error("Unauthorized to invite users");
  if (!user.companyId) throw new Error("No company found");

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser && existingUser.companyId === user.companyId) {
    throw new Error("User is already in the company");
  }

  // Check if an active invite already exists
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email: data.email,
      companyId: user.companyId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    throw new Error("An active invitation already exists for this email");
  }

  // Fetch company name for the email
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true },
  });

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.invitation.create({
    data: {
      email: data.email,
      role: data.role,
      token,
      companyId: user.companyId,
      expiresAt,
    },
  });

  // Send invitation email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/register?inviteToken=${token}`;
  const roleLabel = data.role.charAt(0).toUpperCase() + data.role.slice(1);

  await sendEmail({
    to: data.email,
    subject: `You've been invited to join ${company?.name || "Opsvera"}`,
    html: buildInviteEmailHTML({
      inviterName: user.name,
      companyName: company?.name || "Opsvera",
      role: roleLabel,
      inviteUrl,
    }),
  });

  revalidatePath("/settings/users");
  return invite;
}

export async function getPendingInvitations() {
  const user = await requireMinimumRole("admin");
  if (!user.companyId) return [];

  return prisma.invitation.findMany({
    where: { companyId: user.companyId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function cancelInvitation(id: string) {
  const user = await requireMinimumRole("admin");
  const canInvite = checkPermission(user.role, "users", "write");
  if (!canInvite) throw new Error("Unauthorized");
  if (!user.companyId) throw new Error("No company found");

  await prisma.invitation.update({
    where: { id, companyId: user.companyId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/settings/users");
}

export async function verifyInvitation(token: string) {
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { company: { select: { name: true } } },
  });

  if (!invite) throw new Error("Invalid invitation link");
  if (invite.status !== "PENDING") throw new Error("Invitation is no longer active");
  if (invite.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invite.id }, data: { status: "CANCELLED" } });
    throw new Error("Invitation has expired");
  }

  return invite;
}

export async function acceptInvitation(token: string) {
  const { auth } = await import("@/lib/auth");
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Must be logged in to accept invitation");
  }

  const invite = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invite) throw new Error("Invalid invitation link");
  if (invite.status !== "PENDING") throw new Error("Invitation is no longer active");
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    throw new Error("Please register with the email address the invitation was sent to");
  }

  // Assign user to company
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        companyId: invite.companyId,
        role: invite.role,
      },
    });

    await tx.invitation.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });
  });

  return { success: true };
}
