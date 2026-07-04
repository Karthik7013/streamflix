import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error("No DATABASE_URL"); process.exit(1); }

const sql = postgres(connectionString, { max: 1, connect_timeout: 10 });

try {
  const tables = await sql`
    SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log("Tables:", tables.map(t => t.table_name).join(", "));

  const seriesExists = tables.some(t => t.table_name === "series");
  console.log("Series table exists:", seriesExists);

  if (seriesExists) {
    const count = await sql`SELECT count(*) as c FROM series`;
    console.log("Series count:", count[0].c);

    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'series'
      ORDER BY ordinal_position
    `;
    console.log("Series columns:", cols.map(c => `${c.column_name} (${c.data_type})`).join(", "));

    const data = await sql`
      SELECT id, title, slug, thumbnail_url, created_at
      FROM series ORDER BY created_at DESC LIMIT 10
    `;
    console.log("Sample data:", data.length, "rows");
  }

  const featuredExists = tables.some(t => t.table_name === "featured_series");
  console.log("Featured series table exists:", featuredExists);

  await sql.end({ timeout: 5 });
} catch (e) {
  console.error("ERROR:", e.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error("Full error:", Object.fromEntries(Object.getOwnPropertyNames(e).map(k => [k, String((e as any)[k])])));
  await sql.end({ timeout: 5 }).catch(() => {});
}
