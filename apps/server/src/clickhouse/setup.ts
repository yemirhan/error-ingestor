import { createClient } from "@clickhouse/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "../config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
  console.log("Setting up ClickHouse database...");

  // Create client without database (to create the database)
  const client = createClient({
    host: config.clickhouse.host,
    username: config.clickhouse.username,
    password: config.clickhouse.password,
  });

  try {
    // Read schema file
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Split by semicolon and filter empty statements
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.command({ query: statement });
    }

    console.log("ClickHouse setup complete!");
  } catch (error) {
    console.error("Failed to setup ClickHouse:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setup();
