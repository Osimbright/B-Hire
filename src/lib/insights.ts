import type { Profile, Role } from "@/lib/types";

/** What a profile needs before the other side takes it seriously. */
const CHECKS: Record<Role, { label: string; done: (profile: Profile) => boolean }[]> = {
  freelancer: [
    { label: "Full name", done: (p) => p.full_name.trim().length > 1 },
    { label: "Profile picture", done: (p) => p.avatar_path !== null },
    { label: "Headline", done: (p) => p.headline.trim().length > 0 },
    { label: "Bio of a few sentences", done: (p) => p.bio.trim().length >= 60 },
    { label: "Three or more skills", done: (p) => p.skills.length >= 3 },
    { label: "Hourly rate", done: (p) => p.hourly_rate != null },
    { label: "A portfolio link", done: (p) => p.portfolio_links.length > 0 },
  ],
  client: [
    { label: "Full name", done: (p) => p.full_name.trim().length > 1 },
    { label: "Logo or picture", done: (p) => p.avatar_path !== null },
    { label: "Headline", done: (p) => p.headline.trim().length > 0 },
    { label: "Company or website", done: (p) => p.company.trim().length > 0 || p.website.length > 0 },
    { label: "About your business", done: (p) => p.bio.trim().length >= 40 },
  ],
};

export function profileStrength(profile: Profile) {
  const items = CHECKS[profile.role].map((check) => ({ label: check.label, done: check.done(profile) }));
  const done = items.filter((item) => item.done).length;
  return {
    percent: Math.round((done / items.length) * 100),
    items,
    missing: items.filter((item) => !item.done),
  };
}
