"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Sessions", href: "/sessions", icon: Users },
  { name: "Events", href: "/events", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link href="/dashboard" className="font-bold text-xl">
            Activity Monitor
          </Link>
          <button
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-full p-1 hover:bg-accent"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium">{session?.user?.name || "User"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-lg z-20">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md"
                    onClick={() => {
                      fetch("/api/auth/signout", { method: "POST" }).then(() => window.location.reload());
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}