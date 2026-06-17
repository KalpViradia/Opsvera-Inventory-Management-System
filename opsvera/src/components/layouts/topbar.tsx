"use client";

import { Sun, Moon, LogOut, User, Settings, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { useSidebarStore } from "@/stores/sidebar-store";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { getUnreadNotificationsCount } from "@/actions/notifications";
import { NotificationPanel } from "./notification-panel";
import { CommandPalette } from "./command-palette";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setMobileOpen } = useSidebarStore();
  const router = useRouter();
  
  const { data: session } = useSession();
  const user = session?.user as (Record<string, unknown> & { name?: string; email?: string; image?: string | null; role?: string; companyId?: string }) | undefined;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    getUnreadNotificationsCount().then((count) => {
      setUnreadCount(count);
    });

    const handleNewNotification = () => setUnreadCount(prev => prev + 1);
    window.addEventListener("new-notification", handleNewNotification);
    
    return () => {
      window.removeEventListener("new-notification", handleNewNotification);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-[var(--topbar-height)] flex items-center justify-between px-4 md:px-6 border-b glass shrink-0 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Breadcrumbs */}
        <div className="hidden md:block min-w-0">
          <Breadcrumbs />
        </div>

        {/* Command Palette */}
        <CommandPalette />
      </div>

      <div className="flex items-center gap-1.5 ml-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full text-muted-foreground hover:text-foreground h-9 w-9"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}
        </Button>

        {/* Notifications */}
        <NotificationPanel unreadCount={unreadCount} />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 ml-1"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage {...(user?.image ? { src: user.image } : {})} alt={user?.name || "User avatar"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "..."}
                </p>
                {user?.role && (
                  <p className="text-xs font-semibold capitalize text-primary mt-1">
                    {user.role}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push("/settings/profile")}>
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push("/settings/general")}>
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
