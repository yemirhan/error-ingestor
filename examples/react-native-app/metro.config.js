const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Map workspace packages to their actual locations
config.resolver.extraNodeModules = {
  "@error-ingestor/client": path.resolve(monorepoRoot, "packages/client"),
  "@error-ingestor/shared": path.resolve(monorepoRoot, "packages/shared"),
};

// 4. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 5. Enable symlink support for pnpm
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
