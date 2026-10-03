"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isJobCategory } from "@/lib/config";
import * as db from "@/lib/db";
import { todayISO } from "@/lib/format";
import type { FormState } from "@/lib/types";
import { getString, isUuid } from "@/lib/utils";

function validateJob(fields: Record<string, string>): string | null {
  const budget = Number(fields.budget);
  if (fields.title.length < 3 || fields.title.length > 120) return "Title must be 3–120 characters.";
  if (fields.description.length < 20) return "Add a bit more detail to the description (20+ characters).";
  if (fields.description.length > 10000) return "Description is too long (10,000 characters max).";
  if (!isJobCategory(fields.category)) return "Choose a category.";
  if (!Number.isFinite(budget) || budget <= 0 || budget > 10_000_000) return "Enter a valid budget.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.deadline) || fields.deadline < todayISO()) {
    return "The deadline must be today or later.";
  }
  return null;
}

/** Client: post a new job. */
export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile("client");
  const fields = {
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    category: getString(formData, "category"),
    budget: getString(formData, "budget"),
    deadline: getString(formData, "deadline"),
  };

  const error = validateJob(fields);
  if (error) return { error, fields };

  const job = await db.createJob({ ...fields, budget: Number(fields.budget), client_id: profile.id });

  revalidatePath("/dashboard/client");
  redirect(`/dashboard/client/jobs/${job.id}?posted=1`);
}

/**
 * Client: accept a proposal. Declines the job's other pending proposals and
 * moves the job to "in progress".
 */
export async function acceptProposal(proposalId: string, jobId: string) {
  await requireProfile("client");
  if (!isUuid(proposalId) || !isUuid(jobId)) return;

  const jobPath = `/dashboard/client/jobs/${jobId}`;
  // accept_proposal() checks in the database that this client owns the job.
  if (!(await db.acceptProposal(proposalId))) redirect(`${jobPath}?error=accept`);

  revalidatePath(jobPath);
  revalidatePath("/dashboard/client");
}

/** Client: mark an in-progress job as completed, which unlocks the review. */
export async function completeJob(jobId: string) {
  await requireProfile("client");
  if (!isUuid(jobId)) return;

  const jobPath = `/dashboard/client/jobs/${jobId}`;
  // complete_job() checks in the database that this client owns the job.
  if (!(await db.completeJob(jobId))) redirect(`${jobPath}?error=complete`);

  revalidatePath(jobPath);
  revalidatePath("/dashboard/client");
  redirect(`${jobPath}?completed=1`);
}

/** Client: rate and review the freelancer they hired, once the job is completed. */
export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile("client");
  const jobId = getString(formData, "job_id");
  const fields = { rating: getString(formData, "rating"), body: getString(formData, "body") };
  const rating = Number(fields.rating);

  if (!isUuid(jobId)) return { error: "Unknown job.", fields };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choose a rating from 1 to 5 stars.", fields };
  if (fields.body.length < 10) return { error: "Say a little about how it went (10+ characters).", fields };
  if (fields.body.length > 2000) return { error: "Review is too long (2,000 characters max).", fields };

  const job = await db.getJob(jobId);
  if (!job || job.client_id !== profile.id || !job.hired_freelancer_id) return { error: "Unknown job.", fields };
  if (job.status !== "completed") return { error: "Mark the job as complete before leaving a review.", fields };

  const result = await db.createReview({
    job_id: job.id,
    client_id: profile.id,
    freelancer_id: job.hired_freelancer_id,
    rating,
    body: fields.body,
  });
  if (result === "duplicate") return { error: "You’ve already reviewed this job.", fields };
  if (result === "denied") return { error: "You can only review a completed job you hired for.", fields };

  const jobPath = `/dashboard/client/jobs/${job.id}`;
  revalidatePath(jobPath);
  revalidatePath(`/dashboard/client/freelancers/${job.hired_freelancer_id}`);
  redirect(`${jobPath}?reviewed=1`);
}
