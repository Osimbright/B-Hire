import { ATTACHMENT_BUCKET } from "@/lib/attachments";
import { AVATAR_BUCKET } from "@/lib/avatars";
import { conversationHref } from "@/lib/conversations";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, DirectMessage, Job, Message, Profile, Proposal, Review, Role } from "@/lib/types";

/*
 * B-Hire data layer — every read and write goes through Supabase.
 *
 * Authorisation lives in the database, not here: the row-level security
 * policies in supabase/migrations decide what each signed-in user can see
 * and change, so a missing row comes back as `null` rather than an error.
 * The handful of things RLS deliberately hides — marketplace-wide counters
 * for the public landing page, and a freelancer's track record across other
 * clients' jobs — go through the `security definer` functions in
 * supabase/migrations/20260924000001_public_read.sql.
 */

export const PROFILE_COLS =
  "id, role, full_name, bio, skills, hourly_rate, portfolio_links, created_at, " +
  "avatar_path, headline, location, availability, languages, company, website";
const CLIENT_EMBED = "client:profiles!jobs_client_id_fkey(full_name)";

type Result<T> = { data: T; error: { message: string; code?: string } | null };

/** Throws on a real database error; an empty result is not an error. */
function unwrap<T>(result: Result<T>, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

/** PostgREST returns a to-one embed as an object, older versions as an array. */
function one<T>(embed: T | T[] | null | undefined): T | null {
  if (Array.isArray(embed)) return embed[0] ?? null;
  return embed ?? null;
}

/** `or()` filters are comma-separated, so strip what would break the syntax. */
function likeNeedle(search: string) {
  return search.trim().replace(/[,().\\*]/g, " ").trim();
}

function oldestFirst(a: { created_at: string }, b: { created_at: string }) {
  return a.created_at.localeCompare(b.created_at);
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfile(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
  return unwrap(result as Result<Profile | null>, "Load profile");
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "full_name"
    | "bio"
    | "skills"
    | "hourly_rate"
    | "portfolio_links"
    | "avatar_path"
    | "headline"
    | "location"
    | "availability"
    | "languages"
    | "company"
    | "website"
  >
>;

export async function updateProfile(id: string, update: ProfileUpdate) {
  const supabase = await createClient();
  const result = await supabase
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select(PROFILE_COLS)
    .maybeSingle();
  return unwrap(result as Result<Profile | null>, "Save profile");
}

/** Whether a picture was really uploaded to `path` (the user can only see their own folder). */
export async function avatarExists(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).info(path);
  return !error && Boolean(data);
}

/** Remove a picture that's no longer used. Best effort: a leftover file is harmless. */
export async function deleteAvatarFile(path: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) console.error(`Delete old picture: ${error.message}`);
}

export type FreelancerStats = {
  /** Average star rating, or null with no reviews yet. */
  rating: number | null;
  review_count: number;
  completed_jobs: number;
};

/**
 * Freelancers whose name, bio or skills contain `search`.
 *
 * Goes through `freelancer_cards()`: the completed-job count spans jobs
 * posted by other clients, which the jobs policy hides from the viewer.
 */
export async function listFreelancers(search = ""): Promise<(Profile & FreelancerStats)[]> {
  const supabase = await createClient();
  const result = await supabase.rpc("freelancer_cards", { p_search: search });
  return unwrap(result as Result<(Profile & FreelancerStats)[] | null>, "Load freelancers") ?? [];
}

export type WorkHistoryItem = {
  job: JobWithClient;
  /** The accepted bid. */
  amount: number;
  review: Review | null;
};

export type FreelancerProfile = {
  profile: Profile;
  stats: FreelancerStats & { in_progress: number; total_earned: number };
  /** Jobs they were hired for, newest first. */
  work: WorkHistoryItem[];
  reviews: (Review & { client_name: string; client_avatar_path: string | null; job_title: string })[];
};

/** Everything a client needs to size up a freelancer, or null if `id` isn't a freelancer. */
export async function getFreelancerProfile(id: string): Promise<FreelancerProfile | null> {
  const supabase = await createClient();
  const result = await supabase.rpc("freelancer_profile", { p_id: id });
  return unwrap(result as Result<FreelancerProfile | null>, "Load freelancer");
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type JobWithClient = Job & { client_name: string };

type JobRow = Job & { client?: { full_name: string } | { full_name: string }[] | null };

function withClient(row: JobRow): JobWithClient {
  const { client, ...job } = row;
  return { ...job, client_name: one(client)?.full_name || "Client" };
}

export async function listClientJobs(clientId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("jobs")
    .select("*, proposals(count)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const rows = unwrap(result as Result<(Job & { proposals: { count: number }[] })[] | null>, "Load jobs") ?? [];
  return rows.map(({ proposals, ...job }) => ({
    ...job,
    proposal_count: one(proposals)?.count ?? 0,
  }));
}

export async function listOpenJobs({ search = "", category = "" } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select(`*, ${CLIENT_EMBED}`)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const needle = likeNeedle(search);
  if (needle) query = query.or(`title.ilike.%${needle}%,description.ilike.%${needle}%`);

  const rows = unwrap((await query) as Result<JobRow[] | null>, "Load open jobs") ?? [];
  return rows.map(withClient);
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("jobs").select(`*, ${CLIENT_EMBED}`).eq("id", id).maybeSingle();
  const row = unwrap(result as Result<JobRow | null>, "Load job");
  return row ? withClient(row) : null;
}

export async function createJob(
  input: Pick<Job, "client_id" | "title" | "description" | "category" | "budget" | "deadline">,
) {
  const supabase = await createClient();
  const result = await supabase.from("jobs").insert(input).select("*").single();
  return unwrap(result as Result<Job>, "Post job");
}

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

export type ProposalWithFreelancer = Proposal & { freelancer: Profile | null };
export type ProposalWithJob = Proposal & { job: JobWithClient | null };

export async function listJobProposals(jobId: string): Promise<ProposalWithFreelancer[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("proposals")
    .select(`*, freelancer:profiles!proposals_freelancer_id_fkey(${PROFILE_COLS})`)
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  const rows =
    unwrap(result as Result<(Proposal & { freelancer: Profile | Profile[] | null })[] | null>, "Load proposals") ?? [];
  return rows.map((row) => ({ ...row, freelancer: one(row.freelancer) }));
}

export async function listFreelancerProposals(freelancerId: string): Promise<ProposalWithJob[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("proposals")
    .select(`*, job:jobs(*, ${CLIENT_EMBED})`)
    .eq("freelancer_id", freelancerId)
    .order("created_at", { ascending: false });

  const rows =
    unwrap(result as Result<(Proposal & { job: JobRow | JobRow[] | null })[] | null>, "Load proposals") ?? [];
  return rows.map(({ job, ...proposal }) => {
    const row = one(job);
    return { ...proposal, job: row ? withClient(row) : null };
  });
}

export async function listAppliedJobIds(freelancerId: string) {
  const supabase = await createClient();
  const result = await supabase.from("proposals").select("job_id").eq("freelancer_id", freelancerId);
  const rows = unwrap(result as Result<{ job_id: string }[] | null>, "Load proposals") ?? [];
  return new Set(rows.map((row) => row.job_id));
}

export async function getProposal(jobId: string, freelancerId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("proposals")
    .select("*")
    .eq("job_id", jobId)
    .eq("freelancer_id", freelancerId)
    .maybeSingle();
  return unwrap(result as Result<Proposal | null>, "Load proposal");
}

export async function createProposal(
  input: Pick<Proposal, "job_id" | "freelancer_id" | "cover_note" | "bid">,
): Promise<"ok" | "closed" | "duplicate"> {
  const supabase = await createClient();
  const { error } = await supabase.from("proposals").insert(input);
  if (!error) return "ok";

  // The table's `unique (job_id, freelancer_id)` caught a second proposal…
  if (error.code === "23505") return "duplicate";
  // …and the insert policy rejects anything but an open job.
  if (error.code === "42501") return "closed";
  throw new Error(`Send proposal: ${error.message}`);
}

/**
 * Accept one proposal: decline the job's other pending proposals and move
 * the job to "in_progress". Runs as a single transaction in the database
 * (`accept_proposal()`), which also enforces that only the job's client can
 * do it, and only while the job is open. Returns false if that isn't the case.
 */
export async function acceptProposal(proposalId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_proposal", { p_proposal_id: proposalId });
  return !error;
}

/**
 * Mark an in-progress job as completed. `complete_job()` checks that the
 * caller owns the job and has hired someone. Returns false otherwise.
 */
export async function completeJob(jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_job", { p_job_id: jobId });
  return !error;
}

// ---------------------------------------------------------------------------
// Reviews — one per completed job, from the client about who they hired.
// ---------------------------------------------------------------------------

export async function getJobReview(jobId: string) {
  const supabase = await createClient();
  const result = await supabase.from("reviews").select("*").eq("job_id", jobId).maybeSingle();
  return unwrap(result as Result<Review | null>, "Load review");
}

export async function createReview(
  input: Pick<Review, "job_id" | "client_id" | "freelancer_id" | "rating" | "body">,
): Promise<"ok" | "duplicate" | "denied"> {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert(input);
  if (!error) return "ok";

  // reviews.job_id is unique: this job already has a review…
  if (error.code === "23505") return "duplicate";
  // …and the insert policy only allows it on your own completed job.
  if (error.code === "42501") return "denied";
  throw new Error(`Leave review: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Messages — a conversation is (job, freelancer): the job's client talking
// to one freelancer who sent a proposal on that job.
// ---------------------------------------------------------------------------

export type Conversation = {
  job: JobWithClient;
  proposal: Proposal;
  freelancer_name: string;
  /** Whoever `viewerId` is talking to. */
  other: Profile | null;
};

/** The conversation, or null if it doesn't exist or `viewerId` isn't part of it. */
export async function getConversation(
  jobId: string,
  freelancerId: string,
  viewerId: string,
): Promise<Conversation | null> {
  const supabase = await createClient();
  const [jobResult, proposalResult] = await Promise.all([
    supabase.from("jobs").select(`*, ${CLIENT_EMBED}`).eq("id", jobId).maybeSingle(),
    supabase
      .from("proposals")
      .select("*")
      .eq("job_id", jobId)
      .eq("freelancer_id", freelancerId)
      .maybeSingle(),
  ]);

  const jobRow = unwrap(jobResult as Result<JobRow | null>, "Load conversation");
  const proposal = unwrap(proposalResult as Result<Proposal | null>, "Load conversation");
  if (!jobRow || !proposal) return null;

  const job = withClient(jobRow);
  // Any signed-in user can read an open job, so check participation here too.
  if (viewerId !== job.client_id && viewerId !== freelancerId) return null;

  const otherId = viewerId === job.client_id ? freelancerId : job.client_id;
  const [otherResult, freelancerResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLS).eq("id", otherId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", freelancerId).maybeSingle(),
  ]);

  return {
    job,
    proposal,
    freelancer_name:
      unwrap(freelancerResult as Result<{ full_name: string } | null>, "Load conversation")?.full_name ||
      "Freelancer",
    other: unwrap(otherResult as Result<Profile | null>, "Load conversation"),
  };
}

/** Record that `userId` has seen everything in the conversation so far. */
export async function markConversationRead(userId: string, jobId: string, freelancerId: string) {
  const supabase = await createClient();
  await supabase.from("conversation_reads").upsert(
    {
      user_id: userId,
      job_id: jobId,
      freelancer_id: freelancerId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,job_id,freelancer_id" },
  );
}

export async function listMessages(jobId: string, freelancerId: string) {
  const supabase = await createClient();
  // Newest 200, then flipped back into reading order.
  const result = await supabase
    .from("messages")
    .select("*")
    .eq("job_id", jobId)
    .eq("freelancer_id", freelancerId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = unwrap(result as Result<Message[] | null>, "Load messages") ?? [];
  return rows.reverse();
}

export async function createMessage(
  input: Pick<Message, "job_id" | "freelancer_id" | "sender_id" | "body"> &
    Partial<Pick<Message, "attachment_path" | "attachment_name" | "attachment_type" | "attachment_size">>,
) {
  const supabase = await createClient();
  const result = await supabase.from("messages").insert(input).select("*").single();
  return unwrap(result as Result<Message>, "Send message");
}

// ---------------------------------------------------------------------------
// Direct messages — a conversation is (client, freelancer): a client who
// messaged a freelancer from their profile, outside any job. The client
// writes first; after that either of them can.
// ---------------------------------------------------------------------------

export type DirectConversation = {
  client: Profile;
  freelancer: Profile;
  /** Whoever `viewerId` is talking to. */
  other: Profile;
};

/**
 * The direct conversation, or null if `viewerId` isn't one of the two, the
 * ids aren't a client and a freelancer, or the viewer is the freelancer and
 * the client hasn't written yet.
 */
export async function getDirectConversation(
  clientId: string,
  freelancerId: string,
  viewerId: string,
): Promise<DirectConversation | null> {
  if (viewerId !== clientId && viewerId !== freelancerId) return null;

  const supabase = await createClient();
  const result = await supabase.from("profiles").select(PROFILE_COLS).in("id", [clientId, freelancerId]);
  const rows = unwrap(result as Result<Profile[] | null>, "Load conversation") ?? [];
  const client = rows.find((row) => row.id === clientId && row.role === "client");
  const freelancer = rows.find((row) => row.id === freelancerId && row.role === "freelancer");
  if (!client || !freelancer) return null;

  if (viewerId === freelancerId) {
    const started = await supabase
      .from("direct_messages")
      .select("id")
      .eq("client_id", clientId)
      .eq("freelancer_id", freelancerId)
      .eq("sender_id", clientId)
      .limit(1);
    if ((unwrap(started as Result<{ id: string }[] | null>, "Load conversation") ?? []).length === 0) return null;
  }

  return { client, freelancer, other: viewerId === clientId ? freelancer : client };
}

export async function markDirectConversationRead(userId: string, clientId: string, freelancerId: string) {
  const supabase = await createClient();
  await supabase.from("direct_reads").upsert(
    {
      user_id: userId,
      client_id: clientId,
      freelancer_id: freelancerId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,client_id,freelancer_id" },
  );
}

export async function listDirectMessages(clientId: string, freelancerId: string) {
  const supabase = await createClient();
  // Newest 200, then flipped back into reading order.
  const result = await supabase
    .from("direct_messages")
    .select("*")
    .eq("client_id", clientId)
    .eq("freelancer_id", freelancerId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = unwrap(result as Result<DirectMessage[] | null>, "Load messages") ?? [];
  return rows.reverse();
}

export async function createDirectMessage(
  input: Pick<DirectMessage, "client_id" | "freelancer_id" | "sender_id" | "body"> &
    Partial<Pick<DirectMessage, "attachment_path" | "attachment_name" | "attachment_type" | "attachment_size">>,
) {
  const supabase = await createClient();
  const result = await supabase.from("direct_messages").insert(input).select("*").single();
  return unwrap(result as Result<DirectMessage>, "Send message");
}

// ---------------------------------------------------------------------------
// Chat files and the conversation list — both kinds of conversation.
// ---------------------------------------------------------------------------

/**
 * Size and type of an uploaded chat file, as Storage recorded them, or null
 * if there's no such file or the viewer can't read it.
 */
export async function getAttachmentInfo(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).info(path);
  if (error || !data) return null;
  return { size: data.size ?? 0, type: data.contentType ?? "" };
}

/**
 * A short-lived link to a message's file, or null if the message has none or
 * the viewer isn't in the conversation (the messages policy hides it).
 * `download` makes the browser save it under its original name.
 */
export async function getAttachmentSignedUrl(messageId: string, download: boolean) {
  const supabase = await createClient();
  // The id belongs to a job message or a direct one; look in both.
  const [jobResult, directResult] = await Promise.all(
    (["messages", "direct_messages"] as const).map((table) =>
      supabase.from(table).select("attachment_path, attachment_name").eq("id", messageId).maybeSingle(),
    ),
  );
  type Row = Pick<ChatMessage, "attachment_path" | "attachment_name"> | null;
  const row =
    unwrap(jobResult as Result<Row>, "Load attachment") ?? unwrap(directResult as Result<Row>, "Load attachment");
  if (!row?.attachment_path) return null;

  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(row.attachment_path, ATTACHMENT_LINK_SECONDS, {
      download: download ? (row.attachment_name ?? true) : undefined,
    });
  return error ? null : data.signedUrl;
}

/** How long a signed file link stays valid. */
export const ATTACHMENT_LINK_SECONDS = 60 * 60;

export type Thread = {
  /** Where the conversation opens. */
  href: string;
  kind: "job" | "direct";
  /** The job it's about; null for a direct conversation. */
  job_id: string | null;
  job_title: string | null;
  freelancer_id: string;
  other_id: string;
  other_name: string;
  other_avatar_path: string | null;
  other_role: Role;
  /** Newest message, or null if nobody has written yet. */
  last: ChatMessage | null;
  /** Messages from the other person since the user last opened the conversation. */
  unread: number;
};

/**
 * Every conversation the user can take part in — one per proposal on their
 * jobs (clients) or per proposal they sent (freelancers), plus every direct
 * conversation a client has started. Conversations with messages come
 * first, newest activity on top.
 */
export async function listThreads(userId: string): Promise<Thread[]> {
  const supabase = await createClient();

  // RLS already narrows these to the user's own proposals, the proposals on
  // their jobs and the direct messages they're in — exactly the
  // conversations they belong to.
  const [proposalResult, directResult, directReadResult] = await Promise.all([
    supabase
      .from("proposals")
      .select("job_id, freelancer_id, created_at, job:jobs!proposals_job_id_fkey(id, title, client_id)"),
    supabase.from("direct_messages").select("*").order("created_at", { ascending: true }),
    supabase.from("direct_reads").select("client_id, freelancer_id, read_at").eq("user_id", userId),
  ]);

  type JobRef = { id: string; title: string; client_id: string };
  type Row = { job_id: string; freelancer_id: string; created_at: string; job: JobRef | JobRef[] | null };
  const rows = unwrap(proposalResult as Result<Row[] | null>, "Load conversations") ?? [];
  const directMessages = unwrap(directResult as Result<DirectMessage[] | null>, "Load conversations") ?? [];
  const directReads =
    unwrap(directReadResult as Result<{ client_id: string; freelancer_id: string; read_at: string }[] | null>,
      "Load conversations") ?? [];

  const entries = rows
    .map((row) => ({ ...row, job: one(row.job) }))
    .filter((row): row is typeof row & { job: JobRef } =>
      row.job !== null && (row.job.client_id === userId || row.freelancer_id === userId),
    );
  if (entries.length === 0 && directMessages.length === 0) return [];

  const key = (first: string, freelancerId: string) => `${first}/${freelancerId}`;
  const otherOf = (clientId: string, freelancerId: string) => (clientId === userId ? freelancerId : clientId);

  const jobIds = [...new Set(entries.map((entry) => entry.job_id))];
  const otherIds = [
    ...new Set([
      ...entries.map((entry) => otherOf(entry.job.client_id, entry.freelancer_id)),
      ...directMessages.map((message) => otherOf(message.client_id, message.freelancer_id)),
    ]),
  ];

  const [messages, reads, profiles] = await Promise.all([
    jobIds.length
      ? supabase
          .from("messages")
          .select("*")
          .in("job_id", jobIds)
          .order("created_at", { ascending: true })
          .then((r) => unwrap(r as Result<Message[] | null>, "Load conversations") ?? [])
      : [],
    supabase
      .from("conversation_reads")
      .select("job_id, freelancer_id, read_at")
      .eq("user_id", userId)
      .then((r) =>
        unwrap(r as Result<{ job_id: string; freelancer_id: string; read_at: string }[] | null>,
          "Load conversations") ?? [],
      ),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_path")
      .in("id", otherIds)
      .then(
        (r) =>
          unwrap(r as Result<{ id: string; full_name: string; avatar_path: string | null }[] | null>,
            "Load conversations") ?? [],
      ),
  ]);

  const byThread = new Map<string, Message[]>();
  for (const message of messages) {
    const threadKey = key(message.job_id, message.freelancer_id);
    byThread.set(threadKey, [...(byThread.get(threadKey) ?? []), message]);
  }
  const byDirectThread = new Map<string, DirectMessage[]>();
  for (const message of directMessages) {
    const threadKey = key(message.client_id, message.freelancer_id);
    byDirectThread.set(threadKey, [...(byDirectThread.get(threadKey) ?? []), message]);
  }
  const readAt = new Map(reads.map((row) => [key(row.job_id, row.freelancer_id), row.read_at]));
  const directReadAt = new Map(directReads.map((row) => [key(row.client_id, row.freelancer_id), row.read_at]));
  const profileById = new Map(profiles.map((row) => [row.id, row]));

  const unreadIn = (thread: ChatMessage[], seenAt: string) =>
    thread.filter((m) => m.sender_id !== userId && m.created_at > seenAt).length;
  const other = (clientId: string, freelancerId: string) => {
    const isClient = clientId === userId;
    const otherId = otherOf(clientId, freelancerId);
    return {
      other_id: otherId,
      other_name: profileById.get(otherId)?.full_name || (isClient ? "Freelancer" : "Client"),
      other_avatar_path: profileById.get(otherId)?.avatar_path ?? null,
      other_role: (isClient ? "freelancer" : "client") as Role,
    };
  };

  const jobThreads = entries.map((entry) => {
    const thread = (byThread.get(key(entry.job_id, entry.freelancer_id)) ?? []).sort(oldestFirst);
    const last = thread.at(-1) ?? null;

    return {
      thread: {
        href: conversationHref({ kind: "job", jobId: entry.job_id, freelancerId: entry.freelancer_id }),
        kind: "job",
        job_id: entry.job_id,
        job_title: entry.job.title,
        freelancer_id: entry.freelancer_id,
        ...other(entry.job.client_id, entry.freelancer_id),
        last,
        unread: unreadIn(thread, readAt.get(key(entry.job_id, entry.freelancer_id)) ?? ""),
      } satisfies Thread,
      sortKey: last?.created_at ?? entry.created_at,
    };
  });

  // A direct conversation only exists once someone has written, so each has a last message.
  const directThreads = [...byDirectThread.entries()].map(([threadKey, thread]) => {
    const { client_id: clientId, freelancer_id: freelancerId } = thread[0];
    const last = thread.at(-1) ?? null;

    return {
      thread: {
        href: conversationHref({ kind: "direct", clientId, freelancerId }),
        kind: "direct",
        job_id: null,
        job_title: null,
        freelancer_id: freelancerId,
        ...other(clientId, freelancerId),
        last,
        unread: unreadIn(thread, directReadAt.get(threadKey) ?? ""),
      } satisfies Thread,
      sortKey: last?.created_at ?? "",
    };
  });

  return [...jobThreads, ...directThreads]
    .sort(
      (a, b) =>
        Number(b.thread.last !== null) - Number(a.thread.last !== null) || b.sortKey.localeCompare(a.sortKey),
    )
    .map((entry) => entry.thread);
}

// ---------------------------------------------------------------------------
// Dashboard aggregates — the numbers behind the overview widgets. Each one
// pulls the rows the user is allowed to see and does the arithmetic here,
// so the shapes stay identical to what the widgets already expect.
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type Bucket = { label: string; value: number };

function byWeekday(dates: string[]): Bucket[] {
  const counts = Array<number>(7).fill(0);
  for (const value of dates) {
    const day = new Date(value).getDay(); // 0 = Sunday
    counts[(day + 6) % 7] += 1;
  }
  return WEEKDAYS.map((label, index) => ({ label, value: counts[index] }));
}

/** Counts per week, oldest bucket first, ending with the current week. */
function byWeek(dates: string[], weeks = 8) {
  const counts = Array<number>(weeks).fill(0);
  const now = Date.now();
  for (const value of dates) {
    const age = Math.floor((now - new Date(value).getTime()) / 604_800_000);
    if (age >= 0 && age < weeks) counts[weeks - 1 - age] += 1;
  }
  return counts;
}

function topSlices(totals: Map<string, number>, max = 4): Bucket[] {
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}

export type ClientOverview = {
  jobsPosted: number;
  openJobs: number;
  inProgress: number;
  proposalsReceived: number;
  hires: number;
  conversations: number;
  totalBudget: number;
  committed: number;
  avgProposalsPerJob: number;
  /** 0–1. */
  hireRate: number;
  /** 0–1: share of jobs that have attracted at least one proposal. */
  responseRate: number;
  budgetByCategory: Bucket[];
  proposalsByWeekday: Bucket[];
  proposalsByWeek: number[];
};

export async function getClientOverview(clientId: string): Promise<ClientOverview> {
  const supabase = await createClient();
  const jobs = unwrap(
    (await supabase.from("jobs").select("*").eq("client_id", clientId)) as Result<Job[] | null>,
    "Load overview",
  ) ?? [];

  const jobIds = jobs.map((job) => job.id);
  const [proposals, messages] = jobIds.length
    ? await Promise.all([
        supabase
          .from("proposals")
          .select("*")
          .in("job_id", jobIds)
          .then((r) => unwrap(r as Result<Proposal[] | null>, "Load overview") ?? []),
        supabase
          .from("messages")
          .select("job_id, freelancer_id")
          .in("job_id", jobIds)
          .then((r) => unwrap(r as Result<{ job_id: string; freelancer_id: string }[] | null>, "Load overview") ?? []),
      ])
    : [[] as Proposal[], [] as { job_id: string; freelancer_id: string }[]];

  const hires = proposals.filter((p) => p.status === "accepted");
  const answered = jobs.filter((job) => proposals.some((p) => p.job_id === job.id)).length;
  const conversations = new Set(messages.map((m) => `${m.job_id}/${m.freelancer_id}`)).size;

  const budgets = new Map<string, number>();
  for (const job of jobs) budgets.set(job.category, (budgets.get(job.category) ?? 0) + job.budget);

  return {
    jobsPosted: jobs.length,
    openJobs: jobs.filter((j) => j.status === "open").length,
    inProgress: jobs.filter((j) => j.status === "in_progress").length,
    proposalsReceived: proposals.length,
    hires: hires.length,
    conversations,
    totalBudget: jobs.reduce((sum, job) => sum + job.budget, 0),
    committed: hires.reduce((sum, p) => sum + p.bid, 0),
    avgProposalsPerJob: jobs.length ? proposals.length / jobs.length : 0,
    hireRate: jobs.length ? hires.length / jobs.length : 0,
    responseRate: jobs.length ? answered / jobs.length : 0,
    budgetByCategory: topSlices(budgets),
    proposalsByWeekday: byWeekday(proposals.map((p) => p.created_at)),
    proposalsByWeek: byWeek(proposals.map((p) => p.created_at)),
  };
}

export type FreelancerOverview = {
  sent: number;
  pending: number;
  accepted: number;
  rejected: number;
  /** 0–1 of the proposals the client has actually decided on. */
  winRate: number;
  decided: number;
  pipelineValue: number;
  wonValue: number;
  avgBid: number;
  openJobs: number;
  /** Open jobs mentioning one of the freelancer's skills. */
  matchingJobs: number;
  conversations: number;
  bidsByWeekday: Bucket[];
  bidsByWeek: number[];
  openJobsByCategory: Bucket[];
};

export async function getFreelancerOverview(freelancerId: string): Promise<FreelancerOverview> {
  const supabase = await createClient();
  const [profile, proposals, open, messages] = await Promise.all([
    supabase
      .from("profiles")
      .select("skills")
      .eq("id", freelancerId)
      .maybeSingle()
      .then((r) => unwrap(r as Result<{ skills: string[] } | null>, "Load overview")),
    supabase
      .from("proposals")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .then((r) => unwrap(r as Result<Proposal[] | null>, "Load overview") ?? []),
    supabase
      .from("jobs")
      .select("id, title, description, category")
      .eq("status", "open")
      .then((r) =>
        unwrap(r as Result<{ id: string; title: string; description: string; category: string }[] | null>,
          "Load overview") ?? [],
      ),
    supabase
      .from("messages")
      .select("job_id")
      .eq("freelancer_id", freelancerId)
      .then((r) => unwrap(r as Result<{ job_id: string }[] | null>, "Load overview") ?? []),
  ]);

  const count = (status: Proposal["status"]) => proposals.filter((p) => p.status === status).length;
  const total = (status: Proposal["status"]) =>
    proposals.filter((p) => p.status === status).reduce((sum, p) => sum + p.bid, 0);

  const skills = (profile?.skills ?? []).map((skill) => skill.toLowerCase());
  const matching = open.filter((job) => {
    const haystack = `${job.title} ${job.description} ${job.category}`.toLowerCase();
    return skills.some((skill) => haystack.includes(skill));
  }).length;

  const categories = new Map<string, number>();
  for (const job of open) categories.set(job.category, (categories.get(job.category) ?? 0) + 1);

  const decided = count("accepted") + count("rejected");

  return {
    sent: proposals.length,
    pending: count("pending"),
    accepted: count("accepted"),
    rejected: count("rejected"),
    decided,
    winRate: decided ? count("accepted") / decided : 0,
    pipelineValue: total("pending"),
    wonValue: total("accepted"),
    avgBid: proposals.length ? proposals.reduce((sum, p) => sum + p.bid, 0) / proposals.length : 0,
    openJobs: open.length,
    matchingJobs: matching,
    conversations: new Set(messages.map((m) => m.job_id)).size,
    bidsByWeekday: byWeekday(proposals.map((p) => p.created_at)),
    bidsByWeek: byWeek(proposals.map((p) => p.created_at)),
    openJobsByCategory: topSlices(categories),
  };
}

// ---------------------------------------------------------------------------
// Marketing page — read by logged-out visitors, so each of these goes through
// a `security definer` function that returns aggregates rather than rows.
//
// Unlike the dashboard, these never throw: the homepage is the front door and
// should still render if a query fails, so each one falls back to empty
// numbers and logs the reason.
// ---------------------------------------------------------------------------

export type MarketplaceStats = {
  openJobs: number;
  freelancers: number;
  clients: number;
  liveBudget: number;
  proposals: number;
  hires: number;
  avgProposalsPerJob: number;
  /** 0–1: share of all jobs that received at least one proposal. */
  answeredShare: number;
};

const NO_STATS: MarketplaceStats = {
  openJobs: 0,
  freelancers: 0,
  clients: 0,
  liveBudget: 0,
  proposals: 0,
  hires: 0,
  avgProposalsPerJob: 0,
  answeredShare: 0,
};

/** Logs why a marketing number is missing and falls back to an empty one. */
function orEmpty<T>(what: string, result: Result<T | null>, fallback: T): T {
  if (result.error) {
    console.error(`${what}: ${result.error.message}`);
    return fallback;
  }
  return result.data ?? fallback;
}

/** Public counters for the marketing page. */
export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const supabase = await createClient();
  const result = await supabase.rpc("marketplace_stats");
  return orEmpty("Load marketplace stats", result as Result<MarketplaceStats | null>, NO_STATS);
}

export type LandingReview = Review & {
  client_name: string;
  /** The client's own one-line bio, e.g. "Owner of Fjord Coffee Roasters." */
  client_bio: string;
  freelancer_name: string;
  job_title: string;
};

export type LandingMetrics = {
  rating: {
    /** Average stars across every client review, or null with none yet. */
    average: number | null;
    count: number;
    /** Share of reviews with 5, 4, 3, 2 and 1 stars, in that order. */
    breakdown: number[];
  };
  /**
   * Estimated hours of finished client work: each completed job's accepted bid
   * divided by the hired freelancer's hourly rate. An estimate — the app
   * doesn't track time.
   */
  hoursDelivered: number;
  completedJobs: number;
  /** Freelancers who sent a proposal, sent a message or were working on a job in the last 30 days. */
  activeFreelancers: number;
  totalFreelancers: number;
  /** Median hours to answer a new message from the other person in a conversation. */
  replyHours: number | null;
  /** 0–1: share of proposals a client answered — by message, acceptance or decline. */
  clientResponseRate: number;
  /** Median hours from a proposal arriving to the client's first message about it. */
  clientFirstReplyHours: number | null;
  reviews: LandingReview[];
};

const NO_METRICS: LandingMetrics = {
  rating: { average: null, count: 0, breakdown: [0, 0, 0, 0, 0] },
  hoursDelivered: 0,
  completedJobs: 0,
  activeFreelancers: 0,
  totalFreelancers: 0,
  replyHours: null,
  clientResponseRate: 0,
  clientFirstReplyHours: null,
  reviews: [],
};

/** Trust numbers for the marketing page, all computed from the marketplace itself. */
export async function getLandingMetrics(): Promise<LandingMetrics> {
  const supabase = await createClient();
  const result = await supabase.rpc("landing_metrics");
  return orEmpty("Load landing metrics", result as Result<LandingMetrics | null>, NO_METRICS);
}

/** The newest open job, for the "live on B-Hire" card on the marketing page. */
export async function getLatestOpenJob(): Promise<(JobWithClient & { proposal_count: number }) | null> {
  const supabase = await createClient();
  const result = await supabase.rpc("latest_open_job");
  return orEmpty(
    "Load latest job",
    result as Result<(JobWithClient & { proposal_count: number }) | null>,
    null,
  );
}

export type CategorySummary = {
  category: string;
  openJobs: number;
  avgBudget: number;
  latestTitle: string | null;
};

/**
 * Open-job numbers for each of the given categories, in the order given —
 * always one entry per category, since the showcase pairs them up by index.
 */
export async function getCategorySummaries(categories: readonly string[]): Promise<CategorySummary[]> {
  const empty = categories.map((category) => ({
    category,
    openJobs: 0,
    avgBudget: 0,
    latestTitle: null,
  }));

  const supabase = await createClient();
  const result = await supabase.rpc("category_summaries", { p_categories: categories });
  const rows = orEmpty("Load categories", result as Result<CategorySummary[] | null>, empty);
  return rows.length === categories.length ? rows : empty;
}

// ---------------------------------------------------------------------------
// Contact form — write-only: anyone may submit, and submissions are read in
// the Supabase dashboard rather than through the API.
// ---------------------------------------------------------------------------

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  body: string;
  created_at: string;
};

export async function createContactMessage(input: Pick<ContactMessage, "name" | "email" | "topic" | "body">) {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) throw new Error(`Send message: ${error.message}`);
}
