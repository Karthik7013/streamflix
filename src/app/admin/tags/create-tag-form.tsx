"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CheckIcon, XIcon } from "lucide-react";

export function CreateTagForm({
  onCreate,
  onCancel,
  isPending,
}: {
  onCreate: (name: string) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const valueRef = useRef("");

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
      <Input
        ref={ref as React.Ref<HTMLInputElement>}
        defaultValue=""
        onChange={(e) => { valueRef.current = e.target.value }}
        placeholder="New tag name..."
        className="h-8 max-w-xs"
        autoFocus
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valueRef.current.trim()) {
            onCreate(valueRef.current.trim());
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() => { if (valueRef.current.trim()) onCreate(valueRef.current.trim()) }}
      >
        {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={isPending}>
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
