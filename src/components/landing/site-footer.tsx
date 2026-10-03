import Link from "next/link";
import { BrandMark } from "@/components/ui";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "#platform", label: "How it works" },
      { href: "#categories", label: "Categories" },
      { href: "#reviews", label: "Ratings & reviews" },
      { href: "#stories", label: "Stories" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup?role=client", label: "Start hiring" },
      { href: "/signup?role=freelancer", label: "Find work" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#contact", label: "Contact" },
      { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="px-2 pb-2 pt-3 sm:px-3 sm:pb-3">
      <div className="grain relative mx-auto max-w-[1500px] overflow-hidden rounded-[1.75rem] bg-ink text-bone sm:rounded-[2.5rem]">
        <div className="relative grid gap-12 px-5 pb-10 pt-14 sm:px-10 lg:grid-cols-12 lg:px-16 lg:pt-20">
          <div data-reveal className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-medium tracking-[-0.02em]">
              <BrandMark inverted className="size-9" />
              {APP_NAME}
            </Link>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-ink-muted">
              Connecting businesses with skilled independent professionals — delivering
              exceptional work, on time and on budget.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7" aria-label="Footer">
            {COLUMNS.map((column) => (
              <div key={column.title} data-reveal>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">{column.title}</p>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="break-all text-sm text-bone/85 transition hover:text-zest">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Oversized wordmark, cropped by the bottom edge */}
        <p
          data-reveal
          aria-hidden="true"
          className="pointer-events-none relative -mb-[0.2em] select-none px-3 text-center text-[clamp(6rem,24vw,24rem)] font-light leading-[0.8] tracking-[-0.075em] text-white/[0.06]"
        >
          {APP_NAME}
        </p>

        <div
          data-reveal
          className="relative flex flex-col gap-2 px-5 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16"
        >
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p>Photography via Unsplash</p>
        </div>
      </div>
    </footer>
  );
}
