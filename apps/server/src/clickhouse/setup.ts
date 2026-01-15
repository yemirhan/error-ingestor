import { createClient } from "@clickhouse/client";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "../config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
  console.log("Setting up ClickHouse database...");
  console.log(`Connecting to: ${config.clickhouse.host}`);

  const client = createClient({
    url: config.clickhouse.host,
    username: config.clickhouse.username,
    password: config.clickhouse.password,
  });

  try {
    // Verify schema file exists
    const schemaPath = join(__dirname, "schema.sql");
    console.log(`Schema path: ${schemaPath}`);

    if (!existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = readFileSync(schemaPath, "utf-8");
    console.log(`Schema file loaded (${schema.length} bytes)`);

    // Split by semicolon and filter empty/comment-only statements
    const statements = schema
      .split(";")
      .map((s) => {
        // Remove comment lines and trim
        return s
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim();
      })
      .filter((s) => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing:\n${statement}\n`);
      try {
        await client.command({ query: statement });
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`✗ Statement ${i + 1} failed:`, err);
        throw err;
      }
    }

    // Verify tables were created
    console.log("\nVerifying tables...");
    const result = await client.query({
      query: "SHOW TABLES FROM error_ingestor",
      format: "TabSeparated",
    });
    const tables = await result.text();
    console.log("Tables in error_ingestor:", tables || "(none)");

    console.log("\n✓ ClickHouse setup complete!");
  } catch (error) {
    console.error("Failed to setup ClickHouse:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setup();
