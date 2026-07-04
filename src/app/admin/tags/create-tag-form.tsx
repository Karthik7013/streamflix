"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon } from "lucide-react";

export function CreateTagForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string) => void;
  onCancel: () => void;
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
        onClick={() => { if (valueRef.current.trim()) onCreate(valueRef.current.trim()) }}
      >
        <CheckIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onCancel}>
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
