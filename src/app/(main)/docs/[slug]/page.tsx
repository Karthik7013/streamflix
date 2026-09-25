import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadDocBySlug } from "@/lib/docs";

interface DocPageProps {
  params: Promise<{ slug: string }>;
}

function renderDocBody(body: string): React.ReactNode {
  const lines = body.split("\n").map((l) => l.trimEnd());
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: number) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${key}`} className="mb-4 list-disc pl-5 space-y-1 text-sm text-foreground/90">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
    list = [];
  };

  let bi = 0;
  for (const line of lines) {
    if (!line.trim()) {
      flushList(bi);
      continue;
    }
    const heading = /^##+\s+(.*)$/.exec(line);
    if (heading) {
      flushList(bi);
      blocks.push(
        <h2 key={`h-${bi}`} className="mb-2 mt-6 text-lg font-semibold">
          {heading[1]}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else {
      flushList(bi);
      blocks.push(
        <p key={`p-${bi}`} className="mb-4 text-sm leading-relaxed text-foreground/90">
          {line}
        </p>
      );
    }
    bi++;
  }
  flushList(bi);
  return blocks;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await loadDocBySlug(slug);
  if (!doc) return { title: "Not found" };
  return {
    title: `${doc.title} — StreamFlix Help`,
    description: doc.summary,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = await loadDocBySlug(slug);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        StreamFlix Help
      </p>
      <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
      {doc.summary && (
        <p className="mt-3 text-muted-foreground">{doc.summary}</p>
      )}
      <div className="mt-8">{renderDocBody(doc.content)}</div>
    </div>
  );
}