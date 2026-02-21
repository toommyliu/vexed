import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  cpSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const PACKAGE_DIR = join(fileURLToPath(import.meta.url), "../..");
const REPO_URL = "https://github.com/dmmulroy/better-result.git";
const CLONE_DIR = join(PACKAGE_DIR, ".upstream");
const PATCHES_DIR = join(PACKAGE_DIR, "patches");

function applyPatches() {
  if (!existsSync(PATCHES_DIR)) {
    console.log("No patches directory found, skipping patch application");
    return;
  }

  const patches = readdirSync(PATCHES_DIR).filter((f) => f.endsWith(".patch"));
  if (patches.length === 0) {
    console.log("No patches to apply");
    return;
  }

  console.log(`Applying ${patches.length} patch(es)...`);

  const targetDir = join(PACKAGE_DIR, "src");

  for (const patch of patches.sort()) {
    const patchPath = join(PATCHES_DIR, patch);
    console.log(`  Applying ${patch}...`);

    try {
      execSync(`git apply "${patchPath}"`, {
        cwd: PACKAGE_DIR,
        stdio: "pipe",
        encoding: "utf8",
      });
      console.log(`${patch} applied successfully`);
    } catch (error) {
      console.error(`\nFailed to apply ${patch}`);
      console.error(`Error: ${error.message}`);
      if (error.stderr) {
        console.error(`Details: ${error.stderr}`);
      }
      console.error(
        `\nThe patch may need to be updated for the new upstream version.`,
      );
      throw new Error(`Patch application failed: ${patch}`);
    }
  }

  console.log("All patches applied successfully");
}

function runCommand(cmd, cwd, stdio = "pipe") {
  try {
    return execSync(cmd, { cwd, stdio, encoding: "utf8" });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    throw error;
  }
}

async function sync() {
  console.log("Syncing better-result from upstream...");

  try {
    if (existsSync(CLONE_DIR)) {
      console.log("Pulling latest changes...");
      runCommand(
        "git fetch origin && git reset --hard origin/main",
        CLONE_DIR,
        "pipe",
      );
    } else {
      console.log("Cloning repository...");
      runCommand(
        `git clone --depth 1 ${REPO_URL} ${CLONE_DIR}`,
        PACKAGE_DIR,
        "pipe",
      );
    }

    console.log("Copying source files...");
    const sourceDir = join(CLONE_DIR, "src");
    const targetDir = join(PACKAGE_DIR, "src");

    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }

    cpSync(sourceDir, targetDir, { recursive: true });

    if (process.env.SKIP_PATCHES !== "1") {
      applyPatches();
    } else {
      console.log("Skipping patches...");
    }

    console.log("Updating version...");
    const upstreamPackage = JSON.parse(
      readFileSync(join(CLONE_DIR, "package.json"), "utf8"),
    );
    const localPackage = JSON.parse(
      readFileSync(join(PACKAGE_DIR, "package.json"), "utf8"),
    );

    localPackage.version = upstreamPackage.version;
    writeFileSync(
      join(PACKAGE_DIR, "package.json"),
      JSON.stringify(localPackage, null, 2),
    );

    console.log("Building package...");
    runCommand("npm run build", PACKAGE_DIR, "pipe");

    console.log(`Synced to version ${upstreamPackage.version}`);
  } catch (error) {
    console.error("Sync failed:", error.message);

    // Check if we have a working build to fall back to
    if (existsSync(join(PACKAGE_DIR, "dist", "index.cjs"))) {
      console.log("Using existing build from previous sync");
      process.exit(0);
    }

    console.error("No existing build found, cannot continue");
    process.exit(1);
  }
}

sync();
