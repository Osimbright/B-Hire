import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import clientImage from "@/assets/landing/client-highfive.jpg";
import towersImage from "@/assets/landing/corporate-towers.jpg";
import freelancerImage from "@/assets/landing/desk-flatlay.jpg";
import { SignupForm } from "@/components/forms/signup-form";
import { Icon } from "@/components/icons";

type Path = {
  role: "client" | "freelancer";
  eyebrow: string;
  title: string;
  accent: string;
  perks: string[];
  cta: string;
  image: StaticImageData;
  alt: string;
};

const PATHS: Path[] = [
  {
    role: "client",
    eyebrow: "For clients",
    title: "Hire",
    accent: "talent",
    perks: ["Post a job in minutes", "Compare proposals side by side", "Chat with every applicant"],
    cta: "Create a client account",
    image: clientImage,
    alt: "Two colleagues high-fiving across a desk after a successful meeting",
  },
  {
    role: "freelancer",
    eyebrow: "For freelancers",
    title: "Find",
    accent: "work",
    perks: ["Browse open briefs with real budgets", "Pitch with your profile attached", "Track every proposal's status"],
    cta: "Create a freelancer account",
    image: freelancerImage,
    alt: "A tidy desk with a laptop, notebook and coffee, seen from above",
  },
];

/** Section 6 — choose a side. */
export function CreateAccount() {
  return (
    <section id="join" className="scroll-mt-4 px-4 py-28 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            data-reveal
            className="text-[clamp(2.6rem,5.4vw,4.8rem)] font-light leading-[0.95] tracking-[-0.05em] text-fg lg:col-span-7"
          >
            Create your
            <br />
            <em className="font-serif font-normal">account</em>
          </h2>
          <p data-reveal className="max-w-md text-[15px] leading-7 text-muted lg:col-span-5 lg:justify-self-end">
            Pick the side you&rsquo;re on today. It takes under a minute, and your workspace is
            ready the moment you finish.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {PATHS.map((path) => (
            <Link
              key={path.role}
              data-reveal
              href={`/signup?role=${path.role}`}
              className="group relative isolate flex min-h-[520px] flex-col justify-between overflow-hidden rounded-[2rem] p-6 text-bone sm:p-8 lg:min-h-[620px]"
            >
              <Image
                src={path.image}
                alt={path.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 50vw, 100vw"
                className="-z-20 object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(25,26,22,0.35)_0%,rgba(25,26,22,0.05)_35%,rgba(25,26,22,0.88)_100%)]" />

              <div className="flex items-start justify-between">
                <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium ring-1 ring-inset ring-white/25 backdrop-blur-md">
                  {path.eyebrow}
                </span>
                <span className="grid size-14 place-items-center rounded-full bg-bone text-ink transition duration-500 group-hover:rotate-45 group-hover:bg-zest">
                  <Icon name="arrowUpRight" className="size-5" />
                </span>
              </div>

              <div>
                <p className="text-[clamp(3.5rem,7vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
                  {path.title} <em className="font-serif font-normal text-zest">{path.accent}</em>
                </p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-3">
                  {path.perks.map((perk) => (
                    <li
                      key={perk}
                      className="rounded-2xl bg-white/10 px-4 py-3 text-[13px] leading-5 text-bone/90 ring-1 ring-inset ring-white/15 backdrop-blur-md"
                    >
                      {perk}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                  {path.cta}
                  <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section 7 — sign up without leaving the page. */
export function SignUp() {
  return (
    <section id="signup" className="scroll-mt-4 px-2 pb-3 sm:px-3">
      <div className="mx-auto grid max-w-[1500px] overflow-hidden rounded-[1.75rem] bg-surface sm:rounded-[2.5rem] lg:grid-cols-2">
        <div data-reveal className="grain relative isolate flex min-h-[460px] flex-col justify-between p-6 sm:p-10 lg:p-14">
          <Image
            src={towersImage}
            alt="Glass office towers in a financial district, seen from street level"
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="-z-20 object-cover object-[35%_center]"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(25,26,22,0.6)_0%,rgba(25,26,22,0.35)_35%,rgba(25,26,22,0.82)_70%,rgba(25,26,22,0.9)_100%)]" />

          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-bone/70">Sign up</p>

          <div>
            <h2 className="text-[clamp(2.8rem,5vw,4.6rem)] font-light leading-[0.92] tracking-[-0.055em] text-bone">
              Your next
              <br />
              chapter starts <em className="font-serif font-normal text-zest">here</em>
            </h2>
            <ul className="mt-8 max-w-sm space-y-2 rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-inset ring-white/20 backdrop-blur-xl">
              {["No card needed to get started", "Hire talent or find work — pick your side", "Your dashboard is ready instantly"].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-bone/90">
                  <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-zest text-ink">
                    <Icon name="check" className="size-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-5 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <div data-reveal className="mx-auto max-w-md">
            <h3 className="text-4xl font-light tracking-[-0.045em] text-fg">Create an account</h3>
            <p className="mt-3 text-sm text-muted">
              Already on B-Hire?{" "}
              <Link href="/login" className="font-medium text-fg underline underline-offset-4 hover:text-zest-ink">
                Log in
              </Link>
            </p>

            <div className="mt-9">
              <SignupForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
