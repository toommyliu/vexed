import { join } from "path";
import process from "process";
import fs from "@vexed/fs-utils";
import { app } from "electron";
import fetch from "node-fetch";
import semver from "semver";

const lastUpdateCheckFile = join(
  app.getPath("userData"),
  "last-update-check.txt",
);
const eTagFile = join(app.getPath("userData"), "etag.txt");

const API_URL = "https://api.github.com/repos/toommyliu/vexed/releases/latest";
const currentVersion = app.getVersion();

async function readLastUpdateCheck(): Promise<number | null> {
  try {
    const text = await fs.readFile(lastUpdateCheckFile);
    if (!text) return null;

    const timestamp = Number.parseInt(text, 10);
    if (Number.isNaN(timestamp)) return null;
    return timestamp;
  } catch {
    return null;
  }
}

async function writeLastUpdateCheck(timestamp: number): Promise<void> {
  try {
    await fs.writeFile(lastUpdateCheckFile, String(timestamp));
  } catch {}
}

async function readETag(): Promise<string | null> {
  try {
    return await fs.readFile(eTagFile);
  } catch {
    return null;
  }
}

async function writeETag(eTag: string): Promise<void> {
  try {
    await fs.writeFile(eTagFile, eTag);
  } catch {}
}

/**
 * @param force - Whether to force the update check, bypassing the 24-hour cooldown.
 * @returns True if a newer version is available, false otherwise.
 */
export async function checkForUpdates(
  force: boolean = false,
): Promise<boolean> {
  // if (!app.isPackaged || process.env["NODE_ENV"] === "development") {
  //   console.warn("Skipping update check (not packaged or in development)...");
  //   return false;
  // }

  const lastCheck = (await readLastUpdateCheck()) ?? 0;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1_000;

  if (!force && now - lastCheck < oneDay) {
    console.log("Skipping update check (checked within the last 24 hours)");
    return false;
  }

  if (force) {
    console.log("Force update check requested - bypassing cooldown");
  }

  await writeLastUpdateCheck(now);

  const prevETag = await readETag();
  console.log(`prevETag = ${prevETag}`);

  const resp = await fetch(API_URL)
    .then(async (res) => {
      if (!res.ok || res.status !== 200) {
        return null;
      }

      const eTag = res?.headers?.get("etag") ?? null;

      if (eTag && eTag !== prevETag) {
        await writeETag(eTag);
      }

      return res.json() as Promise<GithubRelease>;
    })
    .catch(() => null);

  if (!resp) {
    return false;
  }

  return semver.gt(resp.tag_name, currentVersion);
}

type GithubRelease = {
  tag_name: string;
};
