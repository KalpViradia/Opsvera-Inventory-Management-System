import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "Opsvera",
  baseURL: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth` : "http://localhost:3000/api/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    twoFactor({
      issuer: "Opsvera",
      allowPasswordless: true,
    }),
  ],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`\n\n================================`);
      console.log(`🔐 PASSWORD RESET REQUEST`);
      console.log(`To reset password for ${user.email}, visit:`);
      console.log(url);
      console.log(`================================\n\n`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
      companyId: {
        type: "string",
        required: false,
      },
    },
  },
});
