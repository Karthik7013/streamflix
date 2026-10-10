import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL (or DATABASE_URL fallback) is not set. Provide it via .env.local or the environment.");
}

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "db",
  "migrations"
);

const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);
const client = postgres(connectionString, {
  max: 1,
  ...(isLocalDb ? {} : { ssl: "require" }),
});

const db = drizzle(client);

async function main() {
  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
