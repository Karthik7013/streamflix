"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CheckIcon, XIcon } from "lucide-react";

export function CreateTagForm({
  onCreate,
  onCancel,
  isPending,
}: {
  onCreate: (name: string, imageUrl?: string) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);
  const nameValueRef = useRef("");
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <Input
          ref={nameRef as React.Ref<HTMLInputElement>}
          defaultValue=""
          onChange={(e) => { nameValueRef.current = e.target.value }}
          placeholder="New tag name..."
          className="h-8 max-w-xs"
          autoFocus
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nameValueRef.current.trim()) {
              onCreate(nameValueRef.current.trim(), imageUrl || undefined);
            }
            if (e.key === "Escape") onCancel();
          }}
        />
        <Input
          ref={imageUrlRef as React.Ref<HTMLInputElement>}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="h-8 max-w-xs"
          disabled={isPending}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={() => { if (nameValueRef.current.trim()) onCreate(nameValueRef.current.trim(), imageUrl || undefined) }}
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
