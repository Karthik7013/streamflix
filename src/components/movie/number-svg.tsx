import { memo } from "react";

interface NumberSVGProps {
  number: number;
}

export const NumberSVG = memo(function NumberSVG({ number }: NumberSVGProps) {
  return (
    <span
      aria-hidden
      className="select-none shrink-0 font-black leading-none text-background"
      style={{
        fontSize: "clamp(96px, 18vw, 230px)",
        WebkitTextStroke: "4px var(--color-foreground)",
        transform: "translateY(0px)",
      }}
    >
      {number}
    </span>
  );
});
