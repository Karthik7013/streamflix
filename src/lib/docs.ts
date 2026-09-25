import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "@/lib/logger";
import { vectorIndex } from "@/lib/vector";
import { nvidiaEmbed } from "@/lib/nvidia";

export const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export async function loadDocBySlug(slug: string): Promise<DocArticle | null> {
  try {
    const source = await readFile(path.join(DOCS_DIR, `${slug}.md`), "utf8");
    return parseDocFile(source);
  } catch {
    return null;
  }
}

export interface DocArticle {
  slug: string;
  title: string;
  summary: string;
  category: string;
  updatedAt: string | null;
  content: string;
}

export interface DocResult {
  title: string;
  slug: string;
  url: string;
  summary: string;
  content: string;
}

export function parseDocFile(source: string): DocArticle | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) return null;
  const header = match[1];
  const content = match[2].trim();
  if (!content) return null;

  const get = (key: string): string | undefined => {
    const line = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(header);
    return line ? line[1].trim() : undefined;
  };

  const slug = get("slug");
  const title = get("title");
  if (!slug || !title) return null;

  return {
    slug,
    title,
    summary: get("summary") ?? "",
    category: get("category") ?? "general",
    updatedAt: get("updatedAt") ?? null,
    content,
  };
}

export async function loadAllDocs(dir = DOCS_DIR): Promise<DocArticle[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    logger.error("docs", "Failed to read docs dir", err);
    return [];
  }

  const docs: DocArticle[] = [];
  for (const entry of entries.filter((e) => e.endsWith(".md"))) {
    const source = await readFile(path.join(dir, entry), "utf8");
    const doc = parseDocFile(source);
    if (doc) docs.push(doc);
    else logger.error("docs", `Skipping unparseable doc file: ${entry}`, new Error("bad frontmatter"));
  }
  return docs;
}

export async function indexDocs(docs: DocArticle[]): Promise<void> {
  if (docs.length === 0) return;

  const BATCH = 16;
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const vectors = await nvidiaEmbed(slice.map((d) => d.content), "passage");
    await vectorIndex.upsert(
      slice.map((d, k) => ({
        id: `docs-${d.slug}`,
        vector: vectors[k],
        metadata: {
          content: d.content,
          source: d.title,
          type: "docs" as const,
          slug: d.slug,
          url: `/docs/${d.slug}`,
          summary: d.summary,
          category: d.category,
        },
      }))
    );
  }
}

export async function deleteDocVector(docSlug: string): Promise<void> {
  try {
    await vectorIndex.delete([`docs-${docSlug}`]);
  } catch (err) {
    logger.error("docs", `Failed to delete doc vector ${docSlug}`, err);
  }
}

export async function reindexAllDocs(): Promise<{ indexed: number; removed: number }> {
  const docs = await loadAllDocs();
  await indexDocs(docs);

  const remote: string[] = [];
  let cursor: number | string = 0;
  for (;;) {
    const page: {
      nextCursor: string;
      vectors: { id: number | string }[];
    } = await vectorIndex.range({
      cursor,
      limit: 100,
      prefix: "docs-",
    });
    remote.push(...(page.vectors ?? []).map((v) => String(v.id)));
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  const active = new Set(docs.map((d) => `docs-${d.slug}`));
  const stale = remote.filter((id) => !active.has(id));
  if (stale.length > 0) {
    await vectorIndex.delete(stale);
  }
  return { indexed: docs.length, removed: stale.length };
}

export async function searchDocsRag(query: string, topK = 3): Promise<DocResult[]> {
  if (!query?.trim()) return [];
  const [embedding] = await nvidiaEmbed([query], "query");
  if (!embedding) return [];

  const results = await vectorIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: `type = "docs"`,
  });

  return results.map((r) => ({
    title: r.metadata?.source ?? "",
    slug: r.metadata?.slug ?? "",
    url: r.metadata?.url ?? "",
    summary: r.metadata?.summary ?? "",
    content: r.metadata?.content ?? "",
  }));
}