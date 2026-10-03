"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Switches between the light and dark themes by setting data-theme on <html>,
 * the same attribute the inline script in app/layout.tsx sets before the first
 * paint. The choice is remembered per browser.
 *
 * Which icon shows is decided in CSS (the `dark:` variant), not in React, so
 * the button renders the same on the server and in the browser and is correct
 * before this component hydrates.
 */
export function ThemeToggle({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  // Until someone picks a theme we follow the operating system, including when
  // it changes while the page is open.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {
        // Storage blocked — following the system is the sensible default anyway.
      }
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // A private window can refuse storage; the theme still applies to this page.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Switch theme"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg",
        onDark
          ? "bg-white/10 text-bone ring-1 ring-inset ring-white/20 backdrop-blur-md hover:bg-white/20"
          : "bg-surface text-muted ring-1 ring-inset ring-line hover:text-fg hover:ring-line-strong",
        className,
      )}
    >
      <Icon name="moon" className="size-[18px] dark:hidden" />
      <Icon name="sun" className="hidden size-[18px] dark:block" />
      {/* The label is picked by CSS too, so it matches the icon before hydration. */}
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:block">Switch to light theme</span>
    </button>
  );
}
