/*
 * Landing page copy that has no source in the app's data yet.
 *
 * ⚠ PLACEHOLDER CONTENT. The testimonials and FAQ answers below are
 * illustrative samples written for the design. Replace them with real,
 * permissioned customer stories before this page goes public — publishing
 * invented testimonials as genuine is misleading to visitors (and regulated in
 * many countries).
 *
 * Ratings, reviews and the trust numbers are NOT here: they come from real
 * data via `getLandingMetrics()` in src/lib/db.ts.
 */

export type Testimonial = {
  name: string;
  role: string;
  location: string;
  headline: string;
  body: string;
  outcome: string[];
  /** Two CSS colours for the portrait artwork. */
  palette: [string, string];
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Amara Osei",
    role: "Founder, wellness app",
    location: "Accra, Ghana",
    headline: "We found our lead designer in a single afternoon.",
    body: "I'd been through two agencies and a job board. On B-Hire I wrote one honest brief with a real budget, and by the evening I was chatting with three designers who had clearly read it. We shipped the new onboarding six weeks later.",
    outcome: ["Hired in 1 day", "6-week project"],
    palette: ["#cbf24c", "#191a16"],
  },
  {
    name: "Lucas Ferreira",
    role: "Freelance iOS developer",
    location: "Lisbon, Portugal",
    headline: "Half my yearly income now starts with a proposal here.",
    body: "The briefs are specific, the budgets are visible, and every client conversation lives next to the job it belongs to. I stopped chasing leads and started choosing projects.",
    outcome: ["14 projects won", "Repeat clients"],
    palette: ["#4f5ddb", "#e9e4d6"],
  },
  {
    name: "Sofia Lindqvist",
    role: "Head of growth, fintech",
    location: "Stockholm, Sweden",
    headline: "Visionary talent with very practical execution.",
    body: "We needed a churn model and a clear report our board could read. Comparing proposals side by side showed us who understood the problem, not just the tools. The result was both rigorous and genuinely useful.",
    outcome: ["Churn down 11%", "Board-ready report"],
    palette: ["#dc6a3f", "#f5f2e9"],
  },
  {
    name: "Kwame Mensah",
    role: "Brand & motion designer",
    location: "Toronto, Canada",
    headline: "It respects freelancers' time — that's rare.",
    body: "One proposal per job means clients take each pitch seriously, and I know right away when a role is filled. No ghosting, no guessing, just clear yes-or-no decisions.",
    outcome: ["92% reply rate", "Avg. bid $2.4k"],
    palette: ["#21907f", "#edf9c7"],
  },
  {
    name: "Elena Rossi",
    role: "Editor-in-chief, online magazine",
    location: "Milan, Italy",
    headline: "Our writers' room grew from two people to twelve.",
    body: "Every piece we commission starts as a job on B-Hire now. The writers we've met here pitch with outlines, meet deadlines and stay for the next story.",
    outcome: ["12 regular writers", "40+ articles"],
    palette: ["#9b5bc7", "#f5f2e9"],
  },
];

export const FAQS = [
  {
    q: "How much does B-Hire cost?",
    a: "Posting a job and sending proposals are free while we're in early access. We'll give everyone plenty of notice before introducing any fees.",
  },
  {
    q: "How do I choose between proposals?",
    a: "Each proposal shows the freelancer's bid, cover note, skills and rate side by side. Message any applicant privately before you decide; accepting one declines the rest automatically.",
  },
  {
    q: "Can I be both a client and a freelancer?",
    a: "Today an account is one or the other. Use a second email address if you want to do both — combined accounts are on our roadmap.",
  },
  {
    q: "What kind of work is on B-Hire?",
    a: "Web and mobile development, design, writing, marketing, data & AI, video and admin support — from one-day fixes to multi-month builds.",
  },
];
