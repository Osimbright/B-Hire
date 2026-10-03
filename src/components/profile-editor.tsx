import type { ReactNode } from "react";
import { Gauge } from "@/components/charts";
import { AvatarUploader } from "@/components/forms/avatar-uploader";
import { ProfileForm } from "@/components/forms/profile-form";
import { Icon } from "@/components/icons";
import { Card, PageHeader, Pill, Widget } from "@/components/ui";
import { profileStrength } from "@/lib/insights";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The "My profile" page for either role: picture and form on the left,
 * completeness and a live preview of how the other side sees you on the right.
 */
export function ProfileEditor({
  profile,
  description,
  previewLabel,
  preview,
}: {
  profile: Profile;
  description: string;
  previewLabel: string;
  preview: ReactNode;
}) {
  const strength = profileStrength(profile);

  return (
    <>
      <PageHeader
        size="display"
        title="My profile"
        description={description}
        meta={<Pill icon="target">{strength.percent}% complete</Pill>}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Card>
            <AvatarUploader
              userId={profile.id}
              role={profile.role}
              name={profile.full_name || "Unnamed user"}
              initialPath={profile.avatar_path}
            />
          </Card>
          <Card>
            <ProfileForm profile={profile} />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Widget eyebrow="Completeness" title="Profile strength">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Gauge value={strength.percent} size={150} />
              <ul className="min-w-0 flex-1 space-y-2.5">
                {strength.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full",
                        item.done ? "bg-zest text-ink" : "bg-canvas-deep text-faint",
                      )}
                    >
                      <Icon name={item.done ? "check" : "x"} className="size-3" />
                    </span>
                    <span className={item.done ? "text-muted" : "font-medium text-fg"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Widget>

          <div className="lg:sticky lg:top-28">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{previewLabel}</p>
            {preview}
          </div>
        </div>
      </div>
    </>
  );
}
