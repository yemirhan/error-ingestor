#!/usr/bin/env node

import { uploadSourceMaps } from "./commands/upload.js";

const args = process.argv.slice(2);
const command = args[0];

function printHelp(): void {
  console.log(`
@error-ingestor/cli - Source Map Upload Tool

Usage:
  npx @error-ingestor/cli <command> [options]

Commands:
  upload-sourcemaps [dir]    Upload source maps from directory (default: dist)

Options:
  --endpoint <url>           Server endpoint URL (or ERROR_INGESTOR_ENDPOINT env)
  --api-key <key>            API key (or ERROR_INGESTOR_API_KEY env)
  --app-version <version>    App version (or npm_package_version env)
  --platform <ios|android>   Platform filter (optional, uploads all by default)
  --dry-run                  Show what would be uploaded without uploading

Environment Variables:
  ERROR_INGESTOR_ENDPOINT    Server endpoint URL
  ERROR_INGESTOR_API_KEY     API key for authentication
  npm_package_version        Used as app version if --app-version not specified

Examples:
  # Upload all source maps from dist directory
  npx @error-ingestor/cli upload-sourcemaps

  # Upload from a specific directory
  npx @error-ingestor/cli upload-sourcemaps ./output

  # Upload with explicit options
  npx @error-ingestor/cli upload-sourcemaps --endpoint https://errors.example.com --api-key ei_xxx
`);
}

async function main(): Promise<void> {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "upload-sourcemaps") {
    // Parse options
    const options: {
      endpoint?: string;
      apiKey?: string;
      appVersion?: string;
      platform?: string;
      dryRun?: boolean;
    } = {};
    let directory = "dist";

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;

      if (arg === "--endpoint" && args[i + 1]) {
        options.endpoint = args[++i];
      } else if (arg === "--api-key" && args[i + 1]) {
        options.apiKey = args[++i];
      } else if (arg === "--app-version" && args[i + 1]) {
        options.appVersion = args[++i];
      } else if (arg === "--platform" && args[i + 1]) {
        options.platform = args[++i];
      } else if (arg === "--dry-run") {
        options.dryRun = true;
      } else if (!arg.startsWith("--")) {
        directory = arg;
      }
    }

    try {
      await uploadSourceMaps(directory, options);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
