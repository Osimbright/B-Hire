"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/actions/auth";
import { Icon, type IconName } from "@/components/icons";
import { UNREAD_CHANGED } from "@/components/messages/events";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, Logo, iconButtonStyles } from "@/components/ui";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Match only the exact path (plus any `alsoActive` paths). */
  exact?: boolean;
  alsoActive?: RegExp;
};

const NAV: Record<Role, NavItem[]> = {
  client: [
    { href: "/dashboard/client", label: "Overview", icon: "grid", exact: true, alsoActive: /^\/dashboard\/client\/jobs\/(?!new)/ },
    { href: "/dashboard/client/jobs/new", label: "Post a job", icon: "plus" },
    { href: "/dashboard/client/freelancers", label: "Freelancers", icon: "users" },
    { href: "/dashboard/client/profile", label: "Profile", icon: "user" },
    { href: "/dashboard/messages", label: "Messages", icon: "chat" },
  ],
  freelancer: [
    { href: "/dashboard/freelancer", label: "Find work", icon: "search", exact: true, alsoActive: /^\/dashboard\/freelancer\/jobs\// },
    { href: "/dashboard/freelancer/proposals", label: "Proposals", icon: "file" },
    { href: "/dashboard/freelancer/profile", label: "Profile", icon: "user" },
    { href: "/dashboard/messages", label: "Messages", icon: "chat" },
  ],
};

const SEARCH_HREF: Record<Role, string> = {
  client: "/dashboard/client/freelancers",
  freelancer: "/dashboard/freelancer",
};

function isActive(item: NavItem, pathname: string) {
  if (pathname === item.href || item.alsoActive?.test(pathname)) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
}

/**
 * The dashboard's floating capsule header: brand, a centred pill switcher and
 * a cluster of round actions. Collapses to a sheet below `lg`.
 */
export function TopNav({
  role,
  name,
  avatarPath,
  unreadThreads,
}: {
  role: Role;
  name: string;
  avatarPath: string | null;
  /** Shows a dot on the Messages action while any conversation has unread messages. */
  unreadThreads: number;
}) {
  const pathname = usePathname();
  // The layout doesn't re-render on navigation, so the messages list reports fresh counts.
  const [unread, setUnread] = useState(unreadThreads);
  useEffect(() => {
    const update = (event: Event) => setUnread((event as CustomEvent<number>).detail);
    window.addEventListener(UNREAD_CHANGED, update);
    return () => window.removeEventListener(UNREAD_CHANGED, update);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  // Close the account menu on an outside click or Escape. (A `fixed inset-0`
  // backdrop can't do this: the capsule's backdrop-blur makes it the containing
  // block, so the backdrop would only cover the header.)
  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);
  const items = NAV[role];
  const closeAll = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1400px] rounded-[1.75rem] bg-canvas/85 px-3 py-2.5 ring-1 ring-line backdrop-blur-md sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Logo href="/dashboard" />

          {/* Desktop switcher */}
          <nav className="hidden items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-line lg:flex">
            {items.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAll}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active ? "bg-fg text-canvas" : "text-muted hover:bg-canvas-soft hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={SEARCH_HREF[role]}
              onClick={closeAll}
              className={iconButtonStyles("hidden sm:grid")}
              aria-label={role === "client" ? "Search freelancers" : "Search jobs"}
            >
              <Icon name="search" className="size-[18px]" />
            </Link>

            <ThemeToggle />

            <Link
              href="/dashboard/messages"
              onClick={closeAll}
              className={iconButtonStyles("relative")}
              aria-label="Messages"
            >
              <Icon name="chat" className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-clay ring-2 ring-surface" />
              )}
            </Link>

            {/* Account */}
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="grid place-items-center rounded-full ring-1 ring-line transition hover:ring-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                <span className="sr-only">Account menu</span>
                <Avatar name={name} src={avatarPath} size="sm" />
              </button>

              {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl bg-surface p-1.5 ring-1 ring-line shadow-[0_20px_44px_-20px_rgba(25,26,22,0.35)]"
                  >
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-fg">{name || "Unnamed user"}</p>
                      <p className="text-xs capitalize text-muted">{role} workspace</p>
                    </div>
                    <Link
                      href={`/dashboard/${role}/profile`}
                      role="menuitem"
                      onClick={closeAll}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-canvas-soft hover:text-fg"
                    >
                      <Icon name="user" className="size-4" />
                      My profile
                    </Link>
                    <form action={logout}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-muted transition hover:bg-canvas-soft hover:text-fg"
                      >
                        <Icon name="logout" className="size-4" />
                        Log out
                      </button>
                    </form>
                  </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={iconButtonStyles("lg:hidden")}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <Icon name={menuOpen ? "x" : "menu"} className="size-[18px]" />
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        {menuOpen && (
          <nav className="mt-2.5 grid gap-1 border-t border-line pt-2.5 lg:hidden">
            {items.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAll}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-fg text-canvas" : "text-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  <Icon name={item.icon} className={cn("size-[18px]", active ? "text-zest" : "text-faint")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
