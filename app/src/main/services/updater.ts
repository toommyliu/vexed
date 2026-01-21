import { join } from "path";
import process from "process";
import fs from "@vexed/fs-utils";
import { Result } from "better-result";
import { app } from "electron";
import fetch from "node-fetch";

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

    console.log("now :: ", now);
    console.log("currentVersion :: ", currentVersion);

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

      if (!isNewer(release.data.tag_name, currentVersion)) {
        return Result.ok(null);
      }

      return Result.ok({
        newVersion: release.data.tag_name,
        currentVersion,
        releaseUrl: release.data.html_url,
      });
    }, this);

    return result.unwrapOr(null);
  }

  private async readLastUpdateCheck() {
    return Result.tryPromise({
      try: async () => {
        const text = await fs.readFile(lastUpdateCheckFile);
        const timestamp = Number.parseInt(text ?? "", 10);
        if (Number.isNaN(timestamp)) return 0;
        return timestamp;
      },
      catch: () => 0,
    });
  }

  private async writeLastUpdateCheck(timestamp: number) {
    return Result.tryPromise({
      try: async () => fs.writeFile(lastUpdateCheckFile, String(timestamp)),
      catch: () => void 0,
    });
  }

  private async readETag() {
    return Result.tryPromise({
      try: async () => fs.readFile(eTagFile),
      catch: () => null,
    });
  }

  private async writeETag(eTag: string) {
    return Result.tryPromise({
      try: async () => fs.writeFile(eTagFile, eTag),
      catch: () => void 0,
    });
  }

  private async fetchRelease() {
    return Result.tryPromise({
      try: async () => {
        const resp = await fetch(this.apiUrl);
        if (resp.status === 304) return null; // Not Modified
        if (!resp.ok || resp.status !== 200) return null;
        const data = (await resp.json()) as GithubRelease;
        const eTag = resp.headers.get("etag");
        return { data, eTag };
      },
      catch: () => null,
    });
  }
}

export const updaterService = new UpdaterService();
