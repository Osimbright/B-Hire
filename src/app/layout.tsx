import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { APP_NAME } from "@/lib/config";
import { REVEAL_SCRIPT } from "@/lib/reveal";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Editorial accent face — used sparingly for italic emphasis in headlines.
 * Self-hosted (Instrument Serif, SIL Open Font License) so it never silently
 * falls back when Google Fonts is slow to respond during a build.
 */
const instrumentSerif = localFont({
  variable: "--font-instrument-serif",
  display: "swap",
  src: [
    { path: "../assets/fonts/instrument-serif-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Hire freelancers, find work`, template: `%s · ${APP_NAME}` },
  description: "A freelance marketplace where clients post jobs and freelancers send proposals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme script below sets data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Pairs with <ScrollReveal>: any page using `data-reveal` must mount it. */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </head>
      <body className="min-h-full bg-canvas font-sans text-fg">{children}</body>
    </html>
  );
}
