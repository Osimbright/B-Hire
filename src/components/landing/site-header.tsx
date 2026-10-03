"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/ui";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#top", label: "Home" },
  { href: "#platform", label: "About" },
  { href: "#categories", label: "Categories" },
  { href: "#reviews", label: "Reviews" },
  { href: "#stories", label: "Stories" },
  { href: "#contact", label: "Contact" },
];

/** Glass navigation that sits on top of the hero photograph. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30 px-4 pt-4 sm:px-7 sm:pt-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-medium tracking-[-0.02em] text-bone">
          <BrandMark inverted className="size-9" />
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-inset ring-white/20 backdrop-blur-md lg:flex">
          {LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium transition",
                index === 0 ? "bg-bone text-ink" : "text-bone/85 hover:bg-white/15 hover:text-bone",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle onDark />
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-bone/90 transition hover:text-bone sm:inline-flex"
          >
            Log in
          </Link>
          <a
            href="#signup"
            className="hidden rounded-full bg-zest px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-zest-deep sm:inline-flex"
          >
            Sign up
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full bg-white/10 text-bone ring-1 ring-inset ring-white/20 backdrop-blur-md lg:hidden"
          >
            <Icon name={open ? "x" : "menu"} className="size-[18px]" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="mt-3 grid gap-1 rounded-3xl bg-ink/80 p-2 ring-1 ring-inset ring-white/15 backdrop-blur-xl lg:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-[15px] text-bone transition hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-1 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <Link href="/login" className="rounded-full px-4 py-3 text-center text-sm font-medium text-bone ring-1 ring-inset ring-white/20">
              Log in
            </Link>
            <a
              href="#signup"
              onClick={() => setOpen(false)}
              className="rounded-full bg-zest px-4 py-3 text-center text-sm font-medium text-ink"
            >
              Sign up
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
