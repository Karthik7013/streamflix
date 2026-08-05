import { memo } from "react";

interface NumberSVGProps {
  number: number;
}

export const NumberSVG = memo(function NumberSVG({ number }: NumberSVGProps) {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <span
        aria-hidden
        className="absolute inset-0 select-none shrink-0 font-black leading-none text-background flex items-center justify-center"
        style={{ textStroke: "4px var(--color-foreground)" }}
      >
        {number}
      </span>
    </div>
  );
});
