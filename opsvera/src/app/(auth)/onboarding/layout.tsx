
"use client";

import { Building2, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Building2 className="w-6 h-6" />
          Opsvera
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={async () => {
            await signOut();
            window.location.href = "/";
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>
    </div>
  );
}
