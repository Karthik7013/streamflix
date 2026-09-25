import { vectorIndex } from "../src/lib/vector";
import { indexMovies, getAllPublishedMoviesForIndex } from "../src/lib/rag";

async function main() {
  const movies = await getAllPublishedMoviesForIndex();
  console.log(`Found ${movies.length} published movies`);

  if (movies.length === 0) {
    console.log("Nothing to index.");
    return;
  }

  await indexMovies(movies);
  console.log(`  ✅ Upserted ${movies.length} movie vectors`);

  const info = await vectorIndex.info();
  console.log(`✨ Done. Vector store status: ${JSON.stringify(info)}`);
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});