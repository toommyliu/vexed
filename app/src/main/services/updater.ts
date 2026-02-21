import { join } from "path";
import process from "process";
import { readFile, writeFile } from "@vexed/fs";
import { Result } from "better-result";
import { app } from "electron";
import fetch from "node-fetch";
import { createLogger } from "./logger";

const logger = createLogger("service:updater");

const lastUpdateCheckFile = join(
  app.getPath("userData"),
  "last-update-check.txt",
);
const eTagFile = join(app.getPath("userData"), "etag.txt");

type GithubRelease = {
  html_url: string;
  tag_name: string;
};
type UpdateResult = {
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

  public async run(force: boolean = false): Promise<UpdateResult | null> {
    if (
      !force &&
      (!app.isPackaged || process.env["NODE_ENV"] === "development")
    )
      return null;

    const now = Date.now();
    const currentVersion = app.getVersion();
    const result = await Result.gen(async function* (this: UpdaterService) {
      const lastCheck = yield* Result.await(this.readLastUpdateCheck());
      if (!force && now - lastCheck < this.checkInterval)
        return Result.ok(null);

      yield* Result.await(this.writeLastUpdateCheck(now));
      const prevETag = yield* Result.await(this.readETag());
      const release = yield* Result.await(this.fetchRelease());

      if (!release) return Result.ok(null);
      if (release.eTag && release.eTag !== prevETag)
        yield* Result.await(this.writeETag(release.eTag));
      if (!isNewer(release.data.tag_name, currentVersion))
        return Result.ok(null);

      return Result.ok({
        newVersion: release.data.tag_name,
        currentVersion,
        releaseUrl: release.data.html_url,
      });
    }, this);
    return result.unwrapOr(null);
  }

  private async readLastUpdateCheck() {
    const textResult = await readFile(lastUpdateCheckFile);
    if (textResult.isErr()) {
      logger.error("Failed to read last update check file", textResult.error);
      return Result.ok(0);
    }

    const timestamp = Number.parseInt(textResult.value ?? "", 10);
    if (Number.isNaN(timestamp)) return Result.ok(0);
    return Result.ok(timestamp);
  }

  private async writeLastUpdateCheck(timestamp: number) {
    const result = await writeFile(lastUpdateCheckFile, String(timestamp));
    if (result.isErr())
      logger.error("Failed to write last update check file", result.error);
    return Result.ok();
  }

  private async readETag() {
    const result = await readFile(eTagFile);
    if (result.isErr()) {
      logger.error("Failed to read ETag file", result.error);
      return Result.ok(null);
    }

    return Result.ok(result.value);
  }

  private async writeETag(eTag: string) {
    const result = await writeFile(eTagFile, eTag);
    if (result.isErr()) logger.error("Failed to write ETag file", result.error);
    return Result.ok();
  }

  private async fetchRelease() {
    return Result.tryPromise({
      try: async () => {
        const resp = await fetch(this.apiUrl);
        if (resp.status === 304) return null; // Not Modified
        if (!resp.ok || resp.status !== 200) {
          logger.error("Failed to fetch release", {
            status: resp.status,
            statusText: resp.statusText,
          });
          return null;
        }

        const data = (await resp.json()) as GithubRelease;
        const eTag = resp.headers.get("etag");
        return { data, eTag };
      },
      catch: (error) => {
        logger.error("Failed to fetch release", error);
        return null;
      },
    });
  }
}

export const updaterService = new UpdaterService();
