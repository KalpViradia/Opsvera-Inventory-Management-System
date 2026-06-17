/**
 * Email utility for sending transactional emails.
 *
 * In development: logs the email to the console with a styled preview.
 * In production: designed to integrate with Resend (https://resend.com).
 *
 * Set RESEND_API_KEY in your environment to enable real email sending.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email. Falls back to console logging in dev / when no provider is configured.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    // Production: send via Resend API
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Opsvera <noreply@opsvera.com>",
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[Email] Resend API error:", err);
        return { success: false, error: err };
      }

      return { success: true };
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error: String(error) };
    }
  }

  // Development fallback: log to console
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ✉️  SIMULATED EMAIL                      ║
╠══════════════════════════════════════════════════════════════╣
║  To:      ${to.padEnd(48)}║
║  Subject: ${subject.padEnd(48)}║
╠══════════════════════════════════════════════════════════════╣
${html
  .replace(/<[^>]*>/g, "")
  .split("\n")
  .filter((l) => l.trim())
  .slice(0, 12)
  .map((l) => `║  ${l.trim().padEnd(56)}║`)
  .join("\n")}
╚══════════════════════════════════════════════════════════════╝
`);

  return { success: true };
}

/**
 * Build a styled HTML email for team invitations.
 */
export function buildInviteEmailHTML({
  inviterName,
  companyName,
  role,
  inviteUrl,
}: {
  inviterName: string;
  companyName: string;
  role: string;
  inviteUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">Opsvera</h1>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 0;">Inventory Management System</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#0f172a;font-size:20px;font-weight:600;margin:0 0 16px;">You've been invited!</h2>
      
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong>${inviterName}</strong> has invited you to join 
        <strong>${companyName}</strong> on Opsvera as a <strong>${role}</strong>.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteUrl}" 
           style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
          Accept Invitation
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:24px 0 0;">
        This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.
      </p>
      
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      
      <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${inviteUrl}" style="color:#2563eb;word-break:break-all;">${inviteUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        © ${new Date().getFullYear()} Opsvera Inc. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}
