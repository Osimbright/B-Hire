import { Icon, type IconName } from "@/components/icons";
import type { Role } from "@/lib/types";

const ROLE_OPTIONS: { value: Role; title: string; description: string; icon: IconName }[] = [
  { value: "client", title: "Client", description: "Post jobs and hire freelancers", icon: "briefcase" },
  { value: "freelancer", title: "Freelancer", description: "Find work and send proposals", icon: "user" },
];

/** Client / freelancer selector: native radios styled as cards (no JS state needed). */
export function RolePicker({ legend, defaultRole }: { legend: string; defaultRole?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {ROLE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="group flex cursor-pointer flex-col rounded-2xl bg-surface p-4 ring-1 ring-line transition hover:ring-line-strong has-checked:bg-ink has-checked:ring-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg"
          >
            <input
              type="radio"
              name="role"
              value={option.value}
              defaultChecked={defaultRole === option.value}
              required
              className="sr-only"
            />
            <span className="grid size-9 place-items-center rounded-xl bg-canvas text-muted transition group-has-checked:bg-zest group-has-checked:text-ink">
              <Icon name={option.icon} />
            </span>
            <span className="mt-3 text-sm font-semibold text-fg group-has-checked:text-bone">
              {option.title}
            </span>
            <span className="mt-0.5 text-xs leading-5 text-muted group-has-checked:text-ink-muted">
              {option.description}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
