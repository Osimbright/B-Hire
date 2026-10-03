import type { Metadata } from "next";
import { FreelancerCard } from "@/components/freelancer-card";
import { ProfileEditor } from "@/components/profile-editor";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "My profile" };

export default async function FreelancerProfilePage() {
  const profile = await requireProfile("freelancer");

  return (
    <ProfileEditor
      profile={profile}
      description="This is what clients see when they browse freelancers or open one of your proposals."
      previewLabel="Preview — how clients see you"
      preview={<FreelancerCard freelancer={profile} />}
    />
  );
}
