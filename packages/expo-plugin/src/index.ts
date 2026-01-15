import { withDangerousMod } from "@expo/config-plugins";
import type { ConfigPlugin } from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

/**
 * Plugin options for @error-ingestor/expo-plugin
 */
export interface ErrorIngestorPluginOptions {
  /**
   * The endpoint URL of your Error Ingestor server.
   * Can also be set via ERROR_INGESTOR_ENDPOINT environment variable.
   */
  endpoint?: string;

  /**
   * API key for authentication.
   * Can also be set via ERROR_INGESTOR_API_KEY environment variable.
   * Recommended to use EAS secrets instead of hardcoding.
   */
  apiKey?: string;

  /**
   * Whether to automatically upload source maps after EAS builds.
   * Defaults to true.
   */
  uploadSourceMaps?: boolean;
}

/**
 * Adds the EAS build hook script to the project if it doesn't exist.
 */
function ensureEasBuildHook(projectRoot: string): void {
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.warn(
      "[@error-ingestor/expo-plugin] Could not find package.json to add EAS build hook"
    );
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Add eas-build-on-success hook if not present
    const hookScript = "npx @error-ingestor/cli upload-sourcemaps";

    if (!packageJson.scripts["eas-build-on-success"]) {
      packageJson.scripts["eas-build-on-success"] = hookScript;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(
        "[@error-ingestor/expo-plugin] Added eas-build-on-success hook to package.json"
      );
    } else if (
      !packageJson.scripts["eas-build-on-success"].includes("@error-ingestor/cli")
    ) {
      // Append to existing hook
      packageJson.scripts["eas-build-on-success"] +=
        ` && ${hookScript}`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(
        "[@error-ingestor/expo-plugin] Appended source map upload to existing eas-build-on-success hook"
      );
    }
  } catch (error) {
    console.warn(
      "[@error-ingestor/expo-plugin] Could not modify package.json:",
      error
    );
  }
}

/**
 * Main Expo config plugin for Error Ingestor.
 *
 * This plugin:
 * 1. Adds EAS build hooks for automatic source map uploads
 * 2. Configures environment variables for the upload script
 *
 * Usage in app.json:
 * ```json
 * {
 *   "expo": {
 *     "plugins": [
 *       ["@error-ingestor/expo-plugin", {
 *         "endpoint": "https://your-server.com"
 *       }]
 *     ]
 *   }
 * }
 * ```
 *
 * Environment variables (set in eas.json or CI):
 * - ERROR_INGESTOR_ENDPOINT: Server endpoint URL
 * - ERROR_INGESTOR_API_KEY: API key for authentication
 */
const withErrorIngestorSourceMaps: ConfigPlugin<ErrorIngestorPluginOptions | void> = (
  config,
  options = {}
) => {
  const { uploadSourceMaps = true } = options || {};

  if (!uploadSourceMaps) {
    return config;
  }

  // Use withDangerousMod to modify the project during prebuild
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;

      // Add EAS build hook
      ensureEasBuildHook(projectRoot);

      return modConfig;
    },
  ]);
};

export default withErrorIngestorSourceMaps;
export { withErrorIngestorSourceMaps };
