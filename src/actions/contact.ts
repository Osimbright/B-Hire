"use server";

import { CONTACT_TOPICS } from "@/lib/config";
import * as db from "@/lib/db";
import type { FormState } from "@/lib/types";
import { getString } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Landing page contact form. Submissions are write-only: anyone may insert,
 * and there's no select policy, so they're read in the Supabase dashboard.
 */
export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const topic = getString(formData, "topic");
  const body = getString(formData, "message");
  const fields = { name, email, topic, message: body };

  if (!name) return { error: "Tell us your name.", fields };
  if (!EMAIL.test(email)) return { error: "Enter a valid email so we can reply.", fields };
  if (!(CONTACT_TOPICS as readonly string[]).includes(topic)) return { error: "Choose a topic.", fields };
  if (body.length < 10) return { error: "Add a little more detail — at least a sentence.", fields };
  if (body.length > 4000) return { error: "Keep it under 4,000 characters.", fields };

  await db.createContactMessage({ name, email, topic, body });
  return { message: `Thanks, ${name.split(" ")[0]}. We'll reply to ${email} within one business day.` };
}
