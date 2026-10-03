export type Role = "client" | "freelancer";
export type JobStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ProposalStatus = "pending" | "accepted" | "rejected";
export type Availability = "available" | "limited" | "unavailable";

/**
 * A row of `public.profiles`. The email address isn't here: Supabase keeps
 * it in `auth.users`, where a user can only ever read their own.
 */
export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  bio: string;
  skills: string[];
  hourly_rate: number | null;
  portfolio_links: string[];
  created_at: string;
  /** Profile picture or logo, a path in the public `avatars` bucket (see avatarUrl()). */
  avatar_path: string | null;
  /** One line under the name: "Senior React developer", "Founder, Fjord Coffee". */
  headline: string;
  location: string;
  /** Freelancers: whether they're taking on new work. */
  availability: Availability;
  /** Freelancers: languages they work in. */
  languages: string[];
  /** Clients: the business they hire for. */
  company: string;
  /** Clients: their business's website. */
  website: string;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string; // YYYY-MM-DD
  status: JobStatus;
  hired_freelancer_id: string | null;
  created_at: string;
}

export interface Proposal {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_note: string;
  bid: number;
  status: ProposalStatus;
  created_at: string;
}

/** A message as the chat shows it, from either kind of conversation. */
export interface ChatMessage {
  id: string;
  sender_id: string;
  /** May be empty when the message is just a file. */
  body: string;
  /** Storage path in the `chat-attachments` bucket; the four attachment fields are all set or all null. */
  attachment_path: string | null;
  /** The file's original name. */
  attachment_name: string | null;
  /** MIME type. */
  attachment_type: string | null;
  /** Bytes. */
  attachment_size: number | null;
  created_at: string;
}

/** A row of `public.messages`: a conversation about a job. */
export interface Message extends ChatMessage {
  job_id: string;
  freelancer_id: string;
}

/** A row of `public.direct_messages`: a client and a freelancer talking outside a job. */
export interface DirectMessage extends ChatMessage {
  client_id: string;
  freelancer_id: string;
}

/** A client's testimonial for a freelancer, left on a job they worked on together. */
export interface Review {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  rating: number; // 1–5
  body: string;
  created_at: string;
}

/**
 * Returned by server actions used with useActionState. `fields` echoes the
 * submitted values so a form can keep them after a validation error.
 */
export type FormState =
  | { error?: string; message?: string; fields?: Record<string, string> }
  | undefined;
