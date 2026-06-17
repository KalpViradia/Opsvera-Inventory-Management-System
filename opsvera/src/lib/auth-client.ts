import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

/**
 * Better Auth client instance for use in client components.
 * Provides signIn, signUp, signOut, useSession, and other auth utilities.
 *
 * The `additionalFields` must mirror server-side auth.ts so TypeScript
 * includes `role` and `companyId` on the session user object.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [twoFactorClient()],
  /** Extend the inferred User type with our custom columns. */
  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        required: false,
      },
      companyId: {
        type: "string" as const,
        required: false,
      },
    },
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

