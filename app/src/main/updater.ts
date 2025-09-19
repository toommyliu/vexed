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

const CHECK_INTERVAL = 24 * 60 * 60 * 1_000; // 24 hours
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

export async function checkForUpdates(
  force: boolean = false,
): Promise<UpdateResult | null> {
  if (!app.isPackaged || process.env["NODE_ENV"] === "development") return null;

  const lastCheck = (await readLastUpdateCheck()) ?? 0;
  const now = Date.now();

  if (!force && now - lastCheck < CHECK_INTERVAL) return null;

  await writeLastUpdateCheck(now);

  const prevETag = await readETag();

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
    return null;
  }

  if (semver.gt(resp.tag_name, currentVersion)) {
    return {
      newVersion: resp.tag_name,
      currentVersion,
      releaseUrl: resp.html_url,
    };
  }

  return null;
}

type GithubRelease = {
  html_url: string;
  tag_name: string; // url to view the corresponding release page
};

type UpdateResult = {
  currentVersion: string;
  newVersion: string;
  releaseUrl: string;
};
