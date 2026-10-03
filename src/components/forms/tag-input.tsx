"use client";

import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * A list of short values as removable chips — type one and press Enter (or
 * a comma) to add it. Each chip is submitted as its own `name` field, so the
 * server action reads them with formData.getAll(name).
 */
export function TagInput({
  id,
  name,
  defaultValue,
  max,
  maxLength = 40,
  placeholder,
  suggestions = [],
}: {
  id: string;
  name: string;
  defaultValue: string[];
  max: number;
  maxLength?: number;
  placeholder?: string;
  /** Offered in the browser's autocomplete list. */
  suggestions?: readonly string[];
}) {
  const [tags, setTags] = useState(defaultValue);
  const [draft, setDraft] = useState("");
  const full = tags.length >= max;

  function add(raw: string) {
    const values = raw
      .split(",")
      .map((value) => value.trim().replace(/\s+/g, " ").slice(0, maxLength))
      .filter(Boolean);
    if (values.length === 0) return;
    setTags((current) => {
      const next = [...current];
      for (const value of values) {
        if (next.length >= max) break;
        if (!next.some((tag) => tag.toLowerCase() === value.toLowerCase())) next.push(value);
      }
      return next;
    });
    setDraft("");
  }

  function remove(index: number) {
    setTags((current) => current.filter((_, i) => i !== index));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key === "Enter" || event.key === ",") && !event.nativeEvent.isComposing) {
      // Enter would otherwise submit the whole form.
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      remove(tags.length - 1);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (/[,\n]/.test(text)) {
      event.preventDefault();
      add(text.replace(/\r?\n/g, ","));
    }
  }

  const listId = suggestions.length > 0 ? `${id}-suggestions` : undefined;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-2xl bg-surface p-2 ring-1 ring-inset ring-line",
        "focus-within:ring-2 focus-within:ring-fg",
      )}
    >
      {tags.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-canvas-soft py-1 pl-3 pr-1 text-sm text-fg ring-1 ring-inset ring-line-soft"
        >
          {tag}
          <input type="hidden" name={name} value={tag} />
          <button
            type="button"
            onClick={() => remove(index)}
            className="grid size-5 place-items-center rounded-full text-faint transition hover:bg-line hover:text-fg"
            aria-label={`Remove ${tag}`}
          >
            <Icon name="x" className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => add(draft)}
        disabled={full}
        maxLength={maxLength}
        list={listId}
        placeholder={full ? `That’s the maximum of ${max}` : tags.length === 0 ? placeholder : "Add another…"}
        className="min-w-32 flex-1 border-0 bg-transparent px-2 py-1 text-sm text-fg placeholder:text-faint focus:outline-none disabled:cursor-not-allowed"
      />
      {listId && (
        <datalist id={listId}>
          {suggestions
            .filter((suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()))
            .map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
        </datalist>
      )}
    </div>
  );
}
