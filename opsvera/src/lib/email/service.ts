export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const provider = process.env.EMAIL_PROVIDER || "console"; // "resend", "sendgrid", "console"

  try {
    if (provider === "console" || process.env.NODE_ENV === "development") {
      console.log("\n==============================================");
      console.log(`[MOCK EMAIL SERVICE] Sending Email`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML Length: ${options.html.length} chars`);
      console.log("==============================================\n");
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    if (provider === "resend") {
      // Setup Resend integration here
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({ ... })
      throw new Error("Resend integration not implemented yet");
    }

    return { success: false, error: "Unknown provider" };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: (error as Error).message };
  }
}
