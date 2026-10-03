/** Where the visitor's light/dark choice is remembered. */
export const THEME_STORAGE_KEY = "bhire-theme";

/**
 * Runs in <head> before the page is painted, so the right theme is in place on
 * the very first frame and nothing flashes. It resolves a stored choice, or
 * falls back to the operating system's setting.
 */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_STORAGE_KEY}");var d=c?c==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})();`;
