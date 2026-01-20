import { join } from "path";
import process from "process";
import fs from "@vexed/fs-utils";
import { app } from "electron";
import fetch from "node-fetch";
import { version } from "../../../package.json";

const lastUpdateCheckFile = join(
  app.getPath("userData"),
  "last-update-check.txt",
);
const eTagFile = join(app.getPath("userData"), "etag.txt");

type GithubRelease = {
  html_url: string;
  tag_name: string;
};

export type UpdateResult = {
  currentVersion: string;
  newVersion: string;
  releaseUrl: string;
};

function parseVersion(version: string): number[] {
  return version.replace(/^v/, "").split(".").map(Number);
}

function isNewer(latest: string, current: string): boolean {
  const latestParts = parseVersion(latest);
  const currentParts = parseVersion(current);
  const maxLength = Math.max(latestParts.length, currentParts.length);
  for (let index = 0; index < maxLength; index++) {
    const val1 = latestParts[index] ?? 0;
    const val2 = currentParts[index] ?? 0;
    if (val1 > val2) return true;
    if (val1 < val2) return false;
  }

  return false;
}

class UpdaterService {
  private readonly checkInterval = 24 * 60 * 60 * 1_000; // 24 hours

  private readonly apiUrl =
    "https://api.github.com/repos/toommyliu/vexed/releases/latest";

  public async checkForUpdates(
    force: boolean = false,
  ): Promise<UpdateResult | null> {
    if (
      !force &&
      (!app.isPackaged || process.env["NODE_ENV"] === "development")
    )
      return null;

    const lastCheck = (await this.readLastUpdateCheck()) ?? 0;
    const now = Date.now();

    if (!force && now - lastCheck < this.checkInterval) return null;

    await this.writeLastUpdateCheck(now);

    const prevETag = await this.readETag();
    const resp = await fetch(this.apiUrl, {
      headers: {
        "If-None-Match": prevETag ?? "",
      },
    })
      .then(async (res) => {
        // 304 Not Modified
        if (res.status === 304) return null;
        if (!res.ok || res.status !== 200) return null;

        const eTag = res.headers.get("etag") ?? null;
        if (eTag && eTag !== prevETag) await this.writeETag(eTag);
        return res.json() as Promise<GithubRelease>;
      })
      .catch(() => null);

    if (!resp) return null;
    if (isNewer(resp.tag_name, version)) {
      return {
        newVersion: resp.tag_name,
        currentVersion: version,
        releaseUrl: resp.html_url,
      };
    }

    return null;
  }

  private async readLastUpdateCheck(): Promise<number | null> {
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

  private async writeLastUpdateCheck(timestamp: number): Promise<void> {
    try {
      await fs.writeFile(lastUpdateCheckFile, String(timestamp));
    } catch {}
  }

  private async readETag(): Promise<string | null> {
    try {
      return await fs.readFile(eTagFile);
    } catch {
      return null;
    }
  }

  private async writeETag(eTag: string): Promise<void> {
    try {
      await fs.writeFile(eTagFile, eTag);
    } catch {}
  }
}

export const updaterService = new UpdaterService();
