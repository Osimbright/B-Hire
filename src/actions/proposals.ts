"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import type { FormState } from "@/lib/types";
import { getString, isUuid } from "@/lib/utils";

/** Freelancer: send a proposal (cover note + bid) for an open job. */
export async function submitProposal(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile("freelancer");
  const jobId = getString(formData, "job_id");
  const fields = { cover_note: getString(formData, "cover_note"), bid: getString(formData, "bid") };
  const bid = Number(fields.bid);

  if (!isUuid(jobId)) return { error: "Unknown job.", fields };
  if (fields.cover_note.length < 20) {
    return { error: "Tell the client a bit more about yourself (20+ characters).", fields };
  }
  if (fields.cover_note.length > 5000) return { error: "Cover note is too long (5,000 max).", fields };
  if (!Number.isFinite(bid) || bid <= 0 || bid > 10_000_000) return { error: "Enter a valid bid.", fields };

  const result = await db.createProposal({
    job_id: jobId,
    freelancer_id: profile.id,
    cover_note: fields.cover_note,
    bid,
  });
  if (result === "duplicate") return { error: "You’ve already sent a proposal for this job.", fields };
  if (result === "closed") return { error: "This job is no longer accepting proposals.", fields };

  revalidatePath(`/dashboard/freelancer/jobs/${jobId}`);
  revalidatePath("/dashboard/freelancer/proposals");
  redirect("/dashboard/freelancer/proposals?sent=1");
}
