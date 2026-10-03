import { Icon, type IconName } from "@/components/icons";
import { ContactForm } from "@/components/landing/contact-form";
import { FAQS } from "@/components/landing/content";
import { CONTACT_EMAIL } from "@/lib/config";

const CHANNELS: { icon: IconName; label: string; value: string; href?: string }[] = [
  { icon: "send", label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: "clock", label: "Response time", value: "Within one business day" },
  { icon: "calendar", label: "Hours", value: "Mon – Fri, 9:00 – 18:00 GMT" },
];

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-4 px-2 sm:px-3">
      <div className="grain relative mx-auto max-w-[1500px] overflow-hidden rounded-[1.75rem] bg-ink text-bone sm:rounded-[2.5rem]">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-zest/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 right-10 size-[30rem] rounded-full bg-plum/20 blur-3xl" />

        <div className="relative grid gap-12 px-5 py-16 sm:px-10 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:px-16 lg:py-24">
          <div className="lg:col-span-6">
            <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Contact
            </p>
            <h2 data-reveal className="mt-6 text-[clamp(3.2rem,7vw,6.5rem)] font-light leading-[0.9] tracking-[-0.055em]">
              Let&rsquo;s <em className="font-serif font-normal text-zest">talk</em>
            </h2>
            <p data-reveal className="mt-6 max-w-md text-[15px] leading-7 text-ink-muted">
              Questions about hiring, a partnership idea, or a project that doesn&rsquo;t fit a
              category? A real person reads every message.
            </p>

            <dl data-reveal className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {CHANNELS.map((channel) => (
                <div key={channel.label} className="flex items-center gap-4 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-zest">
                    <Icon name={channel.icon} className="size-4" />
                  </span>
                  <dt className="w-32 shrink-0 text-sm text-ink-muted">{channel.label}</dt>
                  <dd className="min-w-0 truncate text-[15px]">
                    {channel.href ? (
                      <a href={channel.href} className="underline decoration-white/25 underline-offset-4 hover:decoration-zest">
                        {channel.value}
                      </a>
                    ) : (
                      channel.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div data-reveal className="mt-12">
              <h3 className="text-lg font-light tracking-[-0.02em]">Good to know</h3>
              <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
                {FAQS.map((faq) => (
                  <details key={faq.q} className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[15px] text-bone marker:hidden [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <span className="grid size-7 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-white/20 transition group-open:rotate-45 group-open:bg-zest group-open:text-ink group-open:ring-zest">
                        <Icon name="plus" className="size-3.5" />
                      </span>
                    </summary>
                    <p className="max-w-lg pb-5 text-sm leading-6 text-ink-muted">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div data-reveal className="rounded-[2rem] bg-surface p-6 text-fg sm:p-9">
              <h3 className="text-3xl font-light tracking-[-0.035em]">Send us a message</h3>
              <p className="mt-2 text-sm text-muted">Tell us what you need and we&rsquo;ll take it from there.</p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
