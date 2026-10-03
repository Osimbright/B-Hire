import { TopNav } from "@/components/top-nav";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";

/** Shared shell for both dashboards: floating top bar over the bone canvas. */
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const profile = await requireProfile();
  const threads = await db.listThreads(profile.id);

  return (
    <div className="min-h-screen">
      <TopNav
        role={profile.role}
        name={profile.full_name}
        avatarPath={profile.avatar_path}
        unreadThreads={threads.filter((thread) => thread.unread > 0).length}
      />
      <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
