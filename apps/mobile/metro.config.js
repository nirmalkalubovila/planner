const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Let Metro see workspace packages (packages/core, packages/api, ...) that
// live outside this app's own directory.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
// Deliberately NOT setting disableHierarchicalLookup: true here — it looks
// like the right move for "force a single React copy" but it also blocks
// Metro's normal upward search for a package's own nested node_modules
// (e.g. react-native-reanimated/node_modules/semver, correctly placed
// there by npm because the hoisted root copy is a different major
// version). Verified via `expo export`: without this flag, Metro finds
// both the workspace packages (via watchFolders + nodeModulesPaths above)
// and every package's own nested dependencies correctly.

module.exports = withNativeWind(config, { input: "./src/global.css" });
