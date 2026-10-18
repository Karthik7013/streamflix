"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CheckIcon, XIcon } from "lucide-react";

export function CreatePersonForm({
  onCreate,
  onCancel,
  isPending,
}: {
  onCreate: (name: string, tmdbId?: number, profileUrl?: string) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const tmdbIdRef = useRef<HTMLInputElement>(null);
  const profileUrlRef = useRef<HTMLInputElement>(null);
  const nameValueRef = useRef("");
  const tmdbIdValueRef = useRef("");
  const [profileUrl, setProfileUrl] = useState("");

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b bg-muted/30">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={nameRef as React.Ref<HTMLInputElement>}
          defaultValue=""
          onChange={(e) => { nameValueRef.current = e.target.value }}
          placeholder="Person name..."
          className="h-8 min-w-[180px]"
          autoFocus
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nameValueRef.current.trim()) {
              onCreate(nameValueRef.current.trim(), tmdbIdValueRef.current ? parseInt(tmdbIdValueRef.current, 10) : undefined, profileUrl || undefined);
            }
            if (e.key === "Escape") onCancel();
          }}
        />
        <Input
          ref={tmdbIdRef as React.Ref<HTMLInputElement>}
          value={tmdbIdValueRef.current}
          onChange={(e) => { tmdbIdValueRef.current = e.target.value }}
          placeholder="TMDB ID (optional)"
          className="h-8 min-w-[120px]"
          disabled={isPending}
        />
        <Input
          ref={profileUrlRef as React.Ref<HTMLInputElement>}
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          placeholder="Profile URL (optional)"
          className="h-8 min-w-[160px]"
          disabled={isPending}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={() => { if (nameValueRef.current.trim()) onCreate(nameValueRef.current.trim(), tmdbIdValueRef.current ? parseInt(tmdbIdValueRef.current, 10) : undefined, profileUrl || undefined) }}
        >
          {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={isPending}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
