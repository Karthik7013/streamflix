interface NumberSVGProps {
  number: number;
}

export function NumberSVG({ number }: NumberSVGProps) {
  return (
    <span
      aria-hidden
      className="select-none font-black leading-none text-background"
      style={{
        fontSize: "clamp(140px, 18vw, 230px)",
        WebkitTextStroke: "4px var(--color-foreground)",
        transform: "translateY(0px)",
      }}
    >
      {number}
    </span>
  );
}
