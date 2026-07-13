"use client";

import { Button } from "@/components/ui/button";

interface StatusFilterProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function StatusFilter({ options, value, onChange }: StatusFilterProps) {
  return options.map((option) => (
    <Button
      key={option}
      variant={value === option ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(option)}
    >
      {option === "" ? "All" : option.charAt(0).toUpperCase() + option.slice(1)}
    </Button>
  ));
}
