import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../schema";

if (!process.env.POSTGRES_URL) throw new Error("Missing POSTGRES_URL");

// Create postgres connection
const connectionString = process.env.POSTGRES_URL;
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
