import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { CommandPalette } from "@/components/shared/command-palette";
import { KeyboardShortcutsProvider } from "@/components/providers/keyboard-shortcuts-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <MobileNav />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      <CommandPalette />
      <KeyboardShortcutsProvider />
    </div>
  );
}
