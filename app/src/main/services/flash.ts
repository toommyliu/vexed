import { EOL } from "os";
import { join } from "path";
import { readFile, writeFile, ensureDir, pathExists } from "@vexed/fs";
import { Result } from "better-result";
import { createLogger } from "./logger";

const logger = createLogger("services:flash");

// https://github.com/szwacz/nw-flash-trust/blob/master/main.js

export type FlashTrustStore = {
  add(path: string): Promise<Result<void, Error>>;
  empty(): Promise<Result<void, Error>>;
};

export async function initFlashService(
  appName: string,
  flashRoot: string,
): Promise<Result<FlashTrustStore, Error>> {
  return Result.gen(async function* () {
    logger.debug("Flash root: ", flashRoot);

    const cfgFolder = join(flashRoot, "#Security", "FlashPlayerTrust");
    yield* Result.await(ensureDir(cfgFolder));

    const cfgPath = join(cfgFolder, `${appName}.cfg`);
    let trusted: string[] = [];

    const exists = yield* Result.await(pathExists(cfgPath));
    if (exists) {
      const data = yield* Result.await(readFile(cfgPath));
      trusted = data.split(EOL).filter((line) => line.trim() !== "");
    }

    const save = async (paths: string[]): Promise<Result<void, Error>> => {
      const data = paths.join(EOL);
      const result = await writeFile(cfgPath, data);
      return result as Result<void, Error>;
    };

    return Result.ok({
      empty: async () => {
        trusted = [];
        return save(trusted);
      },
      add: async (path: string) => {
        if (!trusted.includes(path)) {
          trusted.push(path);
          return save(trusted);
        }

        return Result.ok();
      },
    });
  });
}
