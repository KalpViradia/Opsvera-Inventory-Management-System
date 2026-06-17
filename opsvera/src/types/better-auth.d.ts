import "better-auth/react";

declare module "better-auth/react" {
  interface User {
    role?: string | null;
    companyId?: string | null;
  }
}
