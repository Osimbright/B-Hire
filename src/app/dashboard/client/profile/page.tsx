import type { Metadata } from "next";
import { ClientCard } from "@/components/client-card";
import { ProfileEditor } from "@/components/profile-editor";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "My profile" };

export default async function ClientProfilePage() {
  const profile = await requireProfile("client");

  return (
    <ProfileEditor
      profile={profile}
      description="Freelancers see this on your jobs and in messages. A clear picture of your business gets better proposals."
      previewLabel="Preview — how freelancers see you"
      preview={<ClientCard client={profile} />}
    />
  );
}
