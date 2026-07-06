import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";



const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const poolMax = parseInt(process.env.DB_POOL_MAX || "20", 10);
const client = postgres(connectionString, {
  max: poolMax,
  prepare: true,
  idle_timeout: 300,
  connect_timeout: 30,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });
