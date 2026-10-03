"use client";

import { useEffect, useLayoutEffect } from "react";

/** How far apart elements that cross the line together pop in. */
const STAGGER_MS = 90;

/** After this many, the stagger stops growing so a long row never drags. */
const MAX_STEPS = 6;

/**
 * Elements are hidden before the first paint by the inline script in the root
 * layout, so the class that reveals them has to be set before the browser
 * paints too — otherwise a client-side navigation back to the homepage would
 * flash the content in and out. On the server there is no layout pass.
 */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Pops every `data-reveal` element in as it scrolls into view.
 *
 * Mount it once per page. Mark anything that should animate with `data-reveal`
 * — no wrapper components, no per-element delays: elements that come into view
 * together are staggered top to bottom automatically. `data-reveal="fade"`
 * fades without the lift, for cards whose own effects (a fixed background, a
 * pinned overlay) would shift under a transformed ancestor.
 */
export function ScrollReveal() {
  useBeforePaint(() => {
    const root = document.documentElement;

    // Older browsers just get the page, fully visible and unanimated.
    if (!("IntersectionObserver" in window)) {
      root.removeAttribute("data-reveal-ready");
      return;
    }

    // Set again here for client-side navigations, where the inline <head>
    // script does not run a second time.
    root.dataset.revealReady = "";

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          .forEach((entry, index) => {
            const element = entry.target as HTMLElement;
            element.style.setProperty("--reveal-delay", `${Math.min(index, MAX_STEPS) * STAGGER_MS}ms`);
            element.classList.add("is-revealed");
            // Once shown, stay shown — scrolling back up should not re-run it.
            observer.unobserve(element);
          });
      },
      // A sliver is enough, so tall sections fire as their top edge arrives,
      // and the bottom margin holds the pop until the element is properly in.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );

    const watch = (element: Element) => {
      if (!element.classList.contains("is-revealed")) observer.observe(element);
    };

    document.querySelectorAll("[data-reveal]").forEach(watch);

    // Anything rendered after hydration — a tab panel, a carousel slide — joins in.
    const added = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.hasAttribute("data-reveal")) watch(node);
          node.querySelectorAll("[data-reveal]").forEach(watch);
        }
      }
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      added.disconnect();
      // Leaving the page: never leave another route's content hidden.
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
