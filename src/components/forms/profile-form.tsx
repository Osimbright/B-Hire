"use client";

import { useActionState, type ReactNode } from "react";
import { updateProfile } from "@/actions/profile";
import { TagInput } from "@/components/forms/tag-input";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui";
import { AVAILABILITY } from "@/lib/avatars";
import { LANGUAGE_SUGGESTIONS, SKILL_SUGGESTIONS } from "@/lib/config";
import type { Availability, Profile } from "@/lib/types";

/** Edits the signed-in user's profile; the fields depend on whether they're a freelancer or a client. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, undefined);
  // After an error keep what the user typed; otherwise show the saved profile.
  const fields = state?.fields;
  const value = (key: string, saved: string) => fields?.[key] ?? saved;
  const list = (key: string, saved: string[]) => (fields ? fields[key]?.split("\n").filter(Boolean) ?? [] : saved);
  const isFreelancer = profile.role === "freelancer";

  return (
    <form action={action} className="space-y-8">
      <Section title="About you">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full_name">
            <Input
              id="full_name"
              name="full_name"
              required
              maxLength={100}
              autoComplete="name"
              defaultValue={value("full_name", profile.full_name)}
            />
          </Field>
          <Field label="Location" htmlFor="location" hint="City and country, or “Remote”.">
            <Input
              id="location"
              name="location"
              maxLength={80}
              autoComplete="address-level2"
              placeholder="Lagos, Nigeria"
              defaultValue={value("location", profile.location)}
            />
          </Field>
        </div>

        <Field
          label="Headline"
          htmlFor="headline"
          hint={
            isFreelancer
              ? "One line under your name — what you do, e.g. “Full-stack developer · React & Node”."
              : "One line under your name, e.g. “Founder, Fjord Coffee” or “Marketing lead”."
          }
        >
          <Input
            id="headline"
            name="headline"
            maxLength={120}
            placeholder={isFreelancer ? "Brand designer for early-stage startups" : "Founder, Fjord Coffee"}
            defaultValue={value("headline", profile.headline)}
          />
        </Field>

        {!isFreelancer && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Company" htmlFor="company" hint="Leave blank if you hire for yourself.">
              <Input
                id="company"
                name="company"
                maxLength={120}
                autoComplete="organization"
                placeholder="Fjord Coffee Roasters"
                defaultValue={value("company", profile.company)}
              />
            </Field>
            <Field label="Website" htmlFor="website">
              <Input
                id="website"
                name="website"
                type="text"
                inputMode="url"
                maxLength={300}
                autoComplete="url"
                placeholder="fjordcoffee.com"
                defaultValue={value("website", profile.website)}
              />
            </Field>
          </div>
        )}

        <Field
          label="Bio"
          htmlFor="bio"
          hint={
            isFreelancer
              ? "A few sentences about what you do and who you’ve worked with."
              : "What your business does and the kind of work you hire for — it helps freelancers pitch well."
          }
        >
          <Textarea id="bio" name="bio" rows={5} maxLength={2000} defaultValue={value("bio", profile.bio)} />
        </Field>
      </Section>

      {isFreelancer && (
        <Section title="Your work">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Hourly rate (USD)" htmlFor="hourly_rate" hint="Leave blank to hide your rate.">
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min="0"
                step="1"
                placeholder="50"
                defaultValue={value("hourly_rate", profile.hourly_rate?.toString() ?? "")}
              />
            </Field>
            <Field label="Availability" htmlFor="availability" hint="Shown on your profile and card.">
              <Select
                id="availability"
                name="availability"
                defaultValue={value("availability", profile.availability)}
              >
                {(Object.keys(AVAILABILITY) as Availability[]).map((key) => (
                  <option key={key} value={key}>
                    {AVAILABILITY[key].label} — {AVAILABILITY[key].hint}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Skills"
            htmlFor="skills"
            hint="Type a skill and press Enter. Up to 25 — put your strongest first."
          >
            <TagInput
              id="skills"
              name="skills"
              max={25}
              placeholder="e.g. React, Figma, Copywriting"
              suggestions={SKILL_SUGGESTIONS}
              defaultValue={list("skills", profile.skills)}
            />
          </Field>

          <Field label="Languages" htmlFor="languages" hint="Languages you can work in. Press Enter after each.">
            <TagInput
              id="languages"
              name="languages"
              max={10}
              placeholder="e.g. English, French"
              suggestions={LANGUAGE_SUGGESTIONS}
              defaultValue={list("languages", profile.languages)}
            />
          </Field>

          <Field
            label="Portfolio links"
            htmlFor="portfolio_links"
            hint="One URL per line: GitHub, Dribbble, case studies, your website…"
          >
            <Textarea
              id="portfolio_links"
              name="portfolio_links"
              rows={4}
              placeholder="https://"
              defaultValue={value("portfolio_links", profile.portfolio_links.join("\n"))}
            />
          </Field>
        </Section>
      )}

      <FormAlert state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-6 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{title}</legend>
      {children}
    </fieldset>
  );
}
