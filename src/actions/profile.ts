"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { isAvailability } from "@/lib/avatars";
import * as db from "@/lib/db";
import type { FormState } from "@/lib/types";
import { getString, safeUrl } from "@/lib/utils";

/** Trimmed, de-duplicated (case-insensitively) values of a repeated field, e.g. one per skill tag. */
function getList(formData: FormData, key: string) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const value of formData.getAll(key)) {
    const item = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
    if (item && !seen.has(item.toLowerCase())) {
      seen.add(item.toLowerCase());
      values.push(item);
    }
  }
  return values;
}

/**
 * Save the signed-in user's profile. Everyone has a name, headline,
 * location and bio; freelancers add skills, rate, availability, languages
 * and portfolio links, clients their company and website.
 */
export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const isFreelancer = profile.role === "freelancer";

  const skills = getList(formData, "skills");
  const languages = getList(formData, "languages");
  const fields = {
    full_name: getString(formData, "full_name"),
    headline: getString(formData, "headline"),
    location: getString(formData, "location"),
    bio: getString(formData, "bio"),
    // Freelancers
    hourly_rate: getString(formData, "hourly_rate"),
    availability: getString(formData, "availability"),
    portfolio_links: getString(formData, "portfolio_links"),
    skills: skills.join("\n"),
    languages: languages.join("\n"),
    // Clients
    company: getString(formData, "company"),
    website: getString(formData, "website"),
  };

  if (!fields.full_name) return { error: "Your name can’t be empty.", fields };
  if (fields.full_name.length > 100) return { error: "Name is too long (100 characters max).", fields };
  if (fields.headline.length > 120) return { error: "Headline is too long (120 characters max).", fields };
  if (fields.location.length > 80) return { error: "Location is too long (80 characters max).", fields };
  if (fields.bio.length > 2000) return { error: "Bio is too long (2,000 characters max).", fields };

  const shared = {
    full_name: fields.full_name,
    headline: fields.headline,
    location: fields.location,
    bio: fields.bio,
  };

  let update: db.ProfileUpdate;
  if (isFreelancer) {
    if (skills.length > 25) return { error: "Please list 25 skills or fewer.", fields };
    const longSkill = skills.find((skill) => skill.length > 40);
    if (longSkill) return { error: `“${longSkill}” is too long for a skill (40 characters max).`, fields };

    if (languages.length > 10) return { error: "Please list 10 languages or fewer.", fields };
    const longLanguage = languages.find((language) => language.length > 40);
    if (longLanguage) return { error: `“${longLanguage}” is too long for a language.`, fields };

    const hourlyRate = fields.hourly_rate === "" ? null : Number(fields.hourly_rate);
    if (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 100_000)) {
      return { error: "Enter a valid hourly rate.", fields };
    }

    if (!isAvailability(fields.availability)) return { error: "Choose your availability.", fields };

    const links = [...new Set(fields.portfolio_links.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
    const badLink = links.find((link) => !safeUrl(link));
    if (badLink) return { error: `“${badLink}” isn’t a valid http(s) link.`, fields };
    if (links.length > 10) return { error: "Please add 10 portfolio links or fewer.", fields };

    update = {
      ...shared,
      skills,
      languages,
      hourly_rate: hourlyRate,
      availability: fields.availability,
      portfolio_links: links,
    };
  } else {
    if (fields.company.length > 120) return { error: "Company name is too long (120 characters max).", fields };
    // Accept "fjordcoffee.com" as well as a full URL.
    const website =
      fields.website && !/^https?:\/\//i.test(fields.website) ? `https://${fields.website}` : fields.website;
    if (website && (!safeUrl(website) || website.length > 300)) {
      return { error: `“${fields.website}” isn’t a valid website address.`, fields };
    }

    update = { ...shared, company: fields.company, website };
  }

  const updated = await db.updateProfile(profile.id, update);
  if (!updated) return { error: "We couldn’t find your profile.", fields };

  revalidatePath("/dashboard", "layout"); // refreshes the name in the top bar
  return { message: "Profile saved." };
}

/**
 * Set (or with null, remove) the signed-in user's picture. The browser has
 * already uploaded it to their folder in the avatars bucket; the old file is
 * deleted once the new one is saved.
 */
export async function updateAvatar(path: string | null): Promise<{ error?: string }> {
  const profile = await requireProfile();

  if (path !== null) {
    const value = String(path);
    const key = value.slice(profile.id.length + 1);
    if (!value.startsWith(`${profile.id}/`) || !key || key.includes("/") || key.includes("..")) {
      return { error: "That picture doesn’t belong to you." };
    }
    if (!(await db.avatarExists(value))) return { error: "The picture didn’t finish uploading. Please try again." };
  }

  const updated = await db.updateProfile(profile.id, { avatar_path: path });
  if (!updated) return { error: "We couldn’t find your profile." };

  if (profile.avatar_path && profile.avatar_path !== path) await db.deleteAvatarFile(profile.avatar_path);

  revalidatePath("/dashboard", "layout"); // the top bar shows the picture
  return {};
}
