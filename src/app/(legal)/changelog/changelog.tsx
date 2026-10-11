import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { changelogEntries, type ChangelogEntry } from "@/content/changelog";

export interface ChangelogProps {
  className?: string;
  title?: string;
  description?: string;
  entries?: ChangelogEntry[];
}

export function Changelog({
  title = "Changelog",
  description = "Get the latest updates and improvements to our platform.",
  entries = changelogEntries,
  className,
}: ChangelogProps) {
  return (
    <div className={cn("mx-auto max-w-4xl px-6 py-16", className)}>
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
      </div>

      <div className="mt-16 space-y-16">
        {entries.map((entry) => (
          <div key={entry.version} className="relative flex flex-col gap-4 md:flex-row md:gap-4">
            <div className="flex h-min w-64 shrink-0 items-center gap-4 md:sticky md:top-16">
              <Badge className="text-xs">{entry.version}</Badge>
              <span className="text-xs font-medium text-muted-foreground">{entry.date}</span>
            </div>
            <div className="flex flex-col md:border-l-2 md:border-primary md:pl-16">
              <h2 className="mb-3 text-lg leading-tight font-bold text-foreground/90 md:text-2xl">
                {entry.title}
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">{entry.description}</p>
              {entry.items && entry.items.length > 0 && (
                <ul className="mt-4 ml-4 space-y-1.5 text-sm text-muted-foreground md:text-base">
                  {entry.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {entry.image && (
                <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-lg">
                  <Image src={entry.image} alt={`${entry.version} visual`} fill sizes="768px" className="object-cover" />
                </div>
              )}
              {entry.button && (
                <Link
                  href={entry.button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "link" }), "mt-4 self-end")}
                >
                  {entry.button.text} <ArrowUpRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}