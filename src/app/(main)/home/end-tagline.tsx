import Image from "next/image";
import { Heart } from "lucide-react";

export function EndTagline() {
  return (
    <div className="relative flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <Image
        src="/favicon.svg"
         alt="Streamflix Studio Logo"
        width={28}
        height={28}
        className="text-primary"
      />
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        Made with <Heart className="size-3.5 fill-primary text-primary" /> for movie lovers
      </p>
    </div>
  );
}