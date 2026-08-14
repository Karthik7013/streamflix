"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = "", className = "" }: BackButtonProps) {
  const router = useRouter();
  return (
    <Button
      variant={'link'}
      onClick={() => router.back()}
      className={`flex items-center gap-1 text-white/70 hover:text-white transition-colors ${className}`}
    >
      <ChevronLeft className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
