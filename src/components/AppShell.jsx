"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { CalendarDays, CheckSquare, ListChecks, LogOut, LineChart, Settings, Timer, WifiOff } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { NotificationScheduler } from "@/components/NotificationScheduler";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", icon: CheckSquare },
  { href: "/routines", label: "Routines", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/timer", label: "Timer", icon: Timer },
];

const SETTINGS_ITEM = { href: "/settings", label: "Settings", icon: Settings };

export function AppShell({ children }) {
  const pathname = usePathname();
  const online = useOnlineStatus();

  return (
    <div className="min-h-screen md:flex">
      <NotificationScheduler />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:border-r md:border-line md:px-4 md:py-6">
        <span className="font-display text-xl px-2 mb-8">Routine</span>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "text-inkSoft hover:bg-paperDark hover:text-ink"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <Link
            href={SETTINGS_ITEM.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === SETTINGS_ITEM.href
                ? "bg-ink text-paper"
                : "text-inkSoft hover:bg-paperDark hover:text-ink"
            }`}
          >
            <Settings size={18} />
            {SETTINGS_ITEM.label}
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-inkSoft hover:bg-paperDark hover:text-ink"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-0">
        {!online && (
          <div className="flex items-center gap-2 bg-gold/20 text-ink text-sm px-4 py-2">
            <WifiOff size={14} />
            Offline — changes are saved and will sync once you're back online.
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom tab bar. With Timer added to NAV_ITEMS this now holds
          six links — tighter horizontal padding keeps it from crowding on
          narrow phones while staying tappable. */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-paper border-t border-line flex justify-around py-2 z-10">
        {[...NAV_ITEMS, SETTINGS_ITEM].map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] ${
                active ? "text-accent" : "text-inkSoft"
              }`}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
