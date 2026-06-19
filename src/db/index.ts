import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";



const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const client = postgres(connectionString, {
  max: 2,
  prepare: true,
  idle_timeout: 300,
  connect_timeout: 30,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });
