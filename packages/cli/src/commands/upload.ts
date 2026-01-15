import * as fs from "fs";
import * as path from "path";

interface UploadOptions {
  endpoint?: string;
  apiKey?: string;
  appVersion?: string;
  platform?: string;
  dryRun?: boolean;
}

interface SourceMapFile {
  fileName: string;
  filePath: string;
  bundlePath: string | null;
  platform: "ios" | "android" | "web" | "unknown";
}

/**
 * Find all source map files in a directory.
 */
function findSourceMaps(directory: string): SourceMapFile[] {
  const sourceMaps: SourceMapFile[] = [];
  const absoluteDir = path.resolve(directory);

  if (!fs.existsSync(absoluteDir)) {
    return sourceMaps;
  }

  // Recursively search for .map files
  function searchDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.name.endsWith(".map")) {
        // Determine platform from file name or path
        let platform: "ios" | "android" | "web" | "unknown" = "unknown";
        if (entry.name.includes("ios") || fullPath.includes("/ios/")) {
          platform = "ios";
        } else if (entry.name.includes("android") || fullPath.includes("/android/")) {
          platform = "android";
        } else if (entry.name.includes("web") || fullPath.includes("/web/")) {
          platform = "web";
        }

        // Find corresponding bundle file
        const bundleName = entry.name.replace(".map", "");
        const possibleBundlePaths = [
          path.join(dir, bundleName),
          path.join(dir, bundleName + ".js"),
        ];

        let bundlePath: string | null = null;
        for (const bp of possibleBundlePaths) {
          if (fs.existsSync(bp)) {
            bundlePath = bp;
            break;
          }
        }

        sourceMaps.push({
          fileName: entry.name.replace(".map", ""),
          filePath: fullPath,
          bundlePath,
          platform,
        });
      }
    }
  }

  searchDir(absoluteDir);
  return sourceMaps;
}

/**
 * Upload source maps to the Error Ingestor server.
 */
export async function uploadSourceMaps(
  directory: string,
  options: UploadOptions
): Promise<void> {
  // Resolve configuration from options and environment
  const endpoint =
    options.endpoint ||
    process.env.ERROR_INGESTOR_ENDPOINT ||
    process.env.EI_ENDPOINT;

  const apiKey =
    options.apiKey ||
    process.env.ERROR_INGESTOR_API_KEY ||
    process.env.EI_API_KEY;

  const appVersion =
    options.appVersion ||
    process.env.npm_package_version ||
    process.env.EAS_BUILD_APP_VERSION ||
    process.env.APP_VERSION;

  const platformFilter = options.platform as "ios" | "android" | "web" | undefined;
  const dryRun = options.dryRun || false;

  // Validate required configuration
  if (!endpoint) {
    throw new Error(
      "Missing endpoint. Set ERROR_INGESTOR_ENDPOINT env or use --endpoint"
    );
  }

  if (!apiKey) {
    throw new Error(
      "Missing API key. Set ERROR_INGESTOR_API_KEY env or use --api-key"
    );
  }

  if (!appVersion) {
    throw new Error(
      "Missing app version. Set npm_package_version env or use --app-version"
    );
  }

  console.log(`\n📦 Error Ingestor Source Map Upload`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Version:  ${appVersion}`);
  console.log(`   Directory: ${path.resolve(directory)}`);
  if (platformFilter) {
    console.log(`   Platform: ${platformFilter}`);
  }
  if (dryRun) {
    console.log(`   Mode: DRY RUN (no files will be uploaded)\n`);
  } else {
    console.log();
  }

  // Find source maps
  const sourceMaps = findSourceMaps(directory);

  if (sourceMaps.length === 0) {
    console.log("⚠️  No source maps found in", path.resolve(directory));
    console.log("\nExpected locations:");
    console.log("  - dist/bundles/*.map (EAS Update)");
    console.log("  - dist/_expo/static/js/web/*.map (Web export)");
    return;
  }

  // Filter by platform if specified
  const filteredMaps = platformFilter
    ? sourceMaps.filter((sm) => sm.platform === platformFilter)
    : sourceMaps;

  if (filteredMaps.length === 0) {
    console.log(`⚠️  No source maps found for platform: ${platformFilter}`);
    return;
  }

  console.log(`Found ${filteredMaps.length} source map(s):\n`);

  for (const sm of filteredMaps) {
    const size = fs.statSync(sm.filePath).size;
    const sizeKB = (size / 1024).toFixed(1);
    console.log(`  • ${sm.fileName} (${sm.platform}, ${sizeKB} KB)`);
  }

  if (dryRun) {
    console.log("\n✅ Dry run complete. No files were uploaded.");
    return;
  }

  console.log("\nUploading...\n");

  // Upload each source map
  const uploadUrl = `${endpoint.replace(/\/$/, "")}/api/v1/sourcemaps/upload`;
  let successCount = 0;
  let failCount = 0;

  for (const sm of filteredMaps) {
    try {
      const sourceMapContent = fs.readFileSync(sm.filePath, "utf-8");

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          appVersion,
          fileName: sm.fileName,
          sourceMap: sourceMapContent,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`  ❌ ${sm.fileName}: ${response.status} - ${error}`);
        failCount++;
      } else {
        console.log(`  ✅ ${sm.fileName}`);
        successCount++;
      }
    } catch (error) {
      console.log(
        `  ❌ ${sm.fileName}: ${error instanceof Error ? error.message : error}`
      );
      failCount++;
    }
  }

  console.log(`\n📊 Upload complete: ${successCount} succeeded, ${failCount} failed`);

  if (failCount > 0) {
    process.exit(1);
  }
}
