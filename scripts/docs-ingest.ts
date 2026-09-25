import { loadAllDocs, reindexAllDocs } from "../src/lib/docs";

async function main() {
  const docs = await loadAllDocs();
  console.log(`Loaded ${docs.length} doc files`);
  for (const d of docs) console.log(`  - ${d.slug}: ${d.title}`);

  if (docs.length === 0) {
    console.log("Nothing to index.");
    return;
  }

  const { indexed, removed } = await reindexAllDocs();
  console.log(`Indexed ${indexed} docs, removed ${removed} stale vectors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});