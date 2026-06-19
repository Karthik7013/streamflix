"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = "Back", className = "" }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center gap-1 text-white/70 hover:text-white transition-colors ${className}`}
    >
      <ChevronLeft className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
