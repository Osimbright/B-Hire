import { connection } from "next/server";
import dataImage from "@/assets/landing/cat-data.jpg";
import marketingImage from "@/assets/landing/cat-marketing.jpg";
import videoImage from "@/assets/landing/cat-video.jpg";
import webImage from "@/assets/landing/cat-web.jpg";
import writingImage from "@/assets/landing/cat-writing.jpg";
import designImage from "@/assets/landing/wireframes.jpg";
import { CategoryShowcase, type ShowcaseItem } from "@/components/landing/category-showcase";
import { Contact } from "@/components/landing/contact";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CreateAccount, SignUp } from "@/components/landing/join";
import { Platform } from "@/components/landing/platform";
import { ScrollReveal } from "@/components/landing/reveal";
import { Reviews } from "@/components/landing/reviews";
import { SiteFooter } from "@/components/landing/site-footer";
import { Testimonials } from "@/components/landing/testimonials";
import * as db from "@/lib/db";

const SHOWCASE: Omit<ShowcaseItem, "openJobs" | "avgBudget" | "latestTitle">[] = [
  {
    category: "Web Development",
    blurb: "Marketing sites, SaaS dashboards and storefronts, built by developers who ship.",
    image: webImage,
    alt: "A laptop showing code on a bright, tidy desk",
  },
  {
    category: "Design & Creative",
    blurb: "Product, brand and landing page design — from first sketch to handoff.",
    image: designImage,
    alt: "A designer sketching wireframes with a pen",
  },
  {
    category: "Writing & Translation",
    blurb: "Articles, product copy and translation from writers who research first.",
    image: writingImage,
    alt: "A fountain pen writing on lined paper",
  },
  {
    category: "Marketing & Sales",
    blurb: "SEO audits, campaigns and growth work with numbers you can check.",
    image: marketingImage,
    alt: "A laptop displaying an analytics dashboard",
  },
  {
    category: "Data & AI",
    blurb: "Models, pipelines and dashboards that turn messy data into decisions.",
    image: dataImage,
    alt: "A monitor full of charts and data visualizations",
  },
  {
    category: "Video & Animation",
    blurb: "Explainers, launch films and motion design, cut to the story.",
    image: videoImage,
    alt: "A video editing timeline on a screen",
  },
];

export default async function Home() {
  // Render per request so the live numbers reflect the current marketplace.
  await connection();

  const [stats, metrics, latestJob, summaries] = await Promise.all([
    db.getMarketplaceStats(),
    db.getLandingMetrics(),
    db.getLatestOpenJob(),
    db.getCategorySummaries(SHOWCASE.map((item) => item.category)),
  ]);

  // Busiest categories first, so the card that opens selected has live work in it.
  const showcase: ShowcaseItem[] = SHOWCASE.map((item, index) => ({ ...item, ...summaries[index] })).sort(
    (a, b) => b.openJobs - a.openJobs,
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      {/* Pops every `data-reveal` element in as it scrolls into view. */}
      <ScrollReveal />

      <main>
        {/* 1 — Hero */}
        <Hero
          openJobs={stats.openJobs}
          liveBudget={stats.liveBudget}
          job={latestJob}
          rating={metrics.rating}
          activeFreelancers={metrics.activeFreelancers}
        />

        {/* 2 — About the platform + trust numbers (rating, hours delivered, active freelancers, reply time, client response) */}
        <Platform stats={stats} metrics={metrics} />

        <section id="categories" className="scroll-mt-4 px-4 pb-28 sm:px-6 lg:pb-36">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-14 text-center">
              <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Categories
              </p>
              <h2
                data-reveal
                className="mx-auto mt-6 max-w-3xl text-[clamp(2.6rem,5.4vw,4.8rem)] font-light leading-[0.95] tracking-[-0.05em] text-fg"
              >
                Work worth doing,
                <br />
                in every <em className="font-serif font-normal">discipline</em>
              </h2>
            </div>
            <CategoryShowcase items={showcase} />
          </div>
        </section>

        {/* 3 — How a hire happens, on spotlight cards */}
        <HowItWorks stats={stats} metrics={metrics} />

        {/* 4 — Ratings & reviews */}
        <Reviews metrics={metrics} />

        {/* 5 — Testimonials */}
        <Testimonials />

        {/* 6 — Contact */}
        <Contact />

        {/* 7 — Create account */}
        <CreateAccount />

        {/* 8 — Sign up */}
        <SignUp />
      </main>

      <SiteFooter />
    </div>
  );
}
