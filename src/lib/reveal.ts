/**
 * Arms the scroll-reveal animation before the first paint.
 *
 * Everything marked `data-reveal` on the landing page starts hidden, but only
 * while this attribute is on <html>. Running the switch from an inline script
 * in <head> means the hidden state is in place on the very first frame — no
 * flash of content that then disappears — and if the script never runs
 * (JavaScript off, or a blocked bundle) the page simply renders fully visible.
 *
 * The matching CSS lives in app/globals.css; <ScrollReveal> in
 * components/landing/reveal.tsx does the revealing.
 */
export const REVEAL_SCRIPT = `document.documentElement.dataset.revealReady="";`;
