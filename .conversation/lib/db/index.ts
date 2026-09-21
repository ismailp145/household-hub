import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not configured. Database actions will fail until it is set.");
}

const client = postgres(connectionString ?? "postgres://placeholder:placeholder@localhost:5432/placeholder", {
  prepare: false,
});

export const db = drizzle(client, { schema });