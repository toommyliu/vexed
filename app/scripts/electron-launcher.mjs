import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readlinkSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LAUNCHER_VERSION = 2;

const __dirname = dirname(fileURLToPath(import.meta.url));
export const appDir = resolve(__dirname, "..");

const appBranding = JSON.parse(
  readFileSync(join(appDir, "appBranding.json"), "utf8"),
);
const repoRoot = resolve(appDir, "..");
const runtimeDir = join(appDir, ".electron-runtime");
const devIconPngPath = join(repoRoot, "assets", appBranding.dev.iconPng);
const fallbackIconPngPath = join(
  repoRoot,
  "assets",
  appBranding.production.iconPng,
);

function runChecked(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status === 0) {
    return;
  }

  const details = [result.stdout, result.stderr].filter(Boolean).join("\n");
  throw new Error(
    `Failed to run ${command} ${args.join(" ")}: ${details}`.trim(),
  );
}

function setPlistString(plistPath, key, value) {
  const replaceResult = spawnSync(
    "plutil",
    ["-replace", key, "-string", value, plistPath],
    {
      encoding: "utf8",
    },
  );
  if (replaceResult.status === 0) {
    return;
  }

  const insertResult = spawnSync(
    "plutil",
    ["-insert", key, "-string", value, plistPath],
    {
      encoding: "utf8",
    },
  );
  if (insertResult.status === 0) {
    return;
  }

  const details = [replaceResult.stderr, insertResult.stderr]
    .filter(Boolean)
    .join("\n");
  throw new Error(
    `Failed to update plist key "${key}" at ${plistPath}: ${details}`.trim(),
  );
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function resolveDevIconPngPath() {
  if (existsSync(devIconPngPath)) {
    return devIconPngPath;
  }

  if (existsSync(fallbackIconPngPath)) {
    return fallbackIconPngPath;
  }

  return null;
}

function resolveDefaultIconPath(sourceAppBundlePath) {
  return join(sourceAppBundlePath, "Contents", "Resources", "electron.icns");
}

function ensureDevelopmentIconIcns(sourceAppBundlePath) {
  const sourceIconPath = resolveDevIconPngPath();
  const defaultIconPath = resolveDefaultIconPath(sourceAppBundlePath);

  if (!sourceIconPath) {
    return defaultIconPath;
  }

  const generatedIconPath = join(runtimeDir, "icon-dev.icns");
  mkdirSync(runtimeDir, { recursive: true });

  const sourceMtimeMs = statSync(sourceIconPath).mtimeMs;
  if (
    existsSync(generatedIconPath) &&
    statSync(generatedIconPath).mtimeMs >= sourceMtimeMs
  ) {
    return generatedIconPath;
  }

  const iconsetRoot = mkdtempSync(join(runtimeDir, "dev-iconset-"));
  const iconsetDir = join(iconsetRoot, "icon.iconset");
  mkdirSync(iconsetDir, { recursive: true });

  try {
    for (const size of [16, 32, 128, 256, 512]) {
      runChecked("sips", [
        "-z",
        String(size),
        String(size),
        sourceIconPath,
        "--out",
        join(iconsetDir, `icon_${size}x${size}.png`),
      ]);

      const retinaSize = size * 2;
      runChecked("sips", [
        "-z",
        String(retinaSize),
        String(retinaSize),
        sourceIconPath,
        "--out",
        join(iconsetDir, `icon_${size}x${size}@2x.png`),
      ]);
    }

    runChecked("iconutil", ["-c", "icns", iconsetDir, "-o", generatedIconPath]);
    return generatedIconPath;
  } catch (error) {
    console.warn(
      "[electron-launcher] Failed to generate dev macOS icon, falling back to Electron icon.",
      error,
    );
    return defaultIconPath;
  } finally {
    rmSync(iconsetRoot, { recursive: true, force: true });
  }
}

function patchMainBundleInfoPlist(appBundlePath, iconPath) {
  const infoPlistPath = join(appBundlePath, "Contents", "Info.plist");
  setPlistString(
    infoPlistPath,
    "CFBundleDisplayName",
    appBranding.dev.displayName,
  );
  setPlistString(infoPlistPath, "CFBundleName", appBranding.dev.displayName);
  setPlistString(infoPlistPath, "CFBundleIdentifier", appBranding.dev.bundleId);
  setPlistString(infoPlistPath, "CFBundleIconFile", "icon.icns");

  const resourcesDir = join(appBundlePath, "Contents", "Resources");
  copyFileSync(iconPath, join(resourcesDir, "icon.icns"));
  copyFileSync(iconPath, join(resourcesDir, "electron.icns"));
}

function hasExpectedFrameworkSymlinks(appBundlePath) {
  try {
    const frameworkPath = join(
      appBundlePath,
      "Contents",
      "Frameworks",
      "Electron Framework.framework",
    );

    return (
      readlinkSync(join(frameworkPath, "Resources")) ===
        "Versions/Current/Resources" &&
      readlinkSync(join(frameworkPath, "Versions", "Current")) === "A"
    );
  } catch {
    return false;
  }
}

function buildMacLauncher(electronBinaryPath) {
  const sourceAppBundlePath = resolve(electronBinaryPath, "../../..");
  const targetAppBundlePath = join(
    runtimeDir,
    `${appBranding.dev.displayName}.app`,
  );
  const targetBinaryPath = join(
    targetAppBundlePath,
    "Contents",
    "MacOS",
    "Electron",
  );
  const iconPath = ensureDevelopmentIconIcns(sourceAppBundlePath);
  const metadataPath = join(runtimeDir, "metadata.json");

  mkdirSync(runtimeDir, { recursive: true });

  const expectedMetadata = {
    launcherVersion: LAUNCHER_VERSION,
    displayName: appBranding.dev.displayName,
    bundleId: appBranding.dev.bundleId,
    sourceAppBundlePath,
    sourceAppMtimeMs: statSync(sourceAppBundlePath).mtimeMs,
    iconPath,
    iconMtimeMs: statSync(iconPath).mtimeMs,
  };

  const currentMetadata = readJson(metadataPath);
  if (
    existsSync(targetBinaryPath) &&
    currentMetadata &&
    JSON.stringify(currentMetadata) === JSON.stringify(expectedMetadata) &&
    hasExpectedFrameworkSymlinks(targetAppBundlePath)
  ) {
    return targetBinaryPath;
  }

  rmSync(targetAppBundlePath, { recursive: true, force: true });
  cpSync(sourceAppBundlePath, targetAppBundlePath, {
    recursive: true,
    verbatimSymlinks: true,
  });
  patchMainBundleInfoPlist(targetAppBundlePath, iconPath);
  writeFileSync(metadataPath, `${JSON.stringify(expectedMetadata, null, 2)}\n`);

  return targetBinaryPath;
}

export function resolveElectronPath() {
  const require = createRequire(import.meta.url);
  const electronBinaryPath = require("electron");

  if (process.platform !== "darwin") {
    return electronBinaryPath;
  }

  return buildMacLauncher(electronBinaryPath);
}
