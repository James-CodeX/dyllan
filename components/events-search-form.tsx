"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  initialQuery: string;
};

function buildUrl(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function EventsSearchForm({ initialQuery }: Props) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateUrl(nextValue: string, replace = false) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextValue.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    const url = buildUrl(pathname, params);

    if (replace) {
      router.replace(url, { scroll: false });
      return;
    }

    router.push(url, { scroll: false });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl(value);
  }

  function onValueChange(nextValue: string) {
    setValue(nextValue);

    if (!nextValue.trim()) {
      updateUrl("", true);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-1.5">
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onInput={(event) => onValueChange((event.target as HTMLInputElement).value)}
        placeholder="Search"
        aria-label="Search"
        className="h-7 w-24 rounded-none border border-[var(--page-line)] bg-transparent px-2 text-[10px] uppercase tracking-[0.06em] text-[var(--page-text)] outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-32 md:text-[11px]"
      />
      <ThemeToggle className="h-7 w-7" />
    </form>
  );
}
