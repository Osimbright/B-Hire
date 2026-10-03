import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

// The proxy normally handles this; kept as a fallback.
export default async function DashboardIndex() {
  const profile = await requireProfile();
  redirect(`/dashboard/${profile.role}`);
}
