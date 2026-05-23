import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { EOL, homedir, release } from "os";
import { join } from "path";
import { Effect, Layer, ServiceMap } from "effect";

export interface SyncTrustManager {
  readonly add: (trustedPath: string) => void;
  readonly remove: (trustedPath: string) => void;
  readonly isTrusted: (trustedPath: string) => boolean;
  readonly list: () => readonly string[];
  readonly empty: () => void;
}

export interface TrustManager {
  readonly add: (trustedPath: string) => Effect.Effect<void, FlashTrustError>;
  readonly remove: (
    trustedPath: string,
  ) => Effect.Effect<void, FlashTrustError>;
  readonly isTrusted: (
    trustedPath: string,
  ) => Effect.Effect<boolean, FlashTrustError>;
  readonly list: Effect.Effect<readonly string[], FlashTrustError>;
  readonly empty: Effect.Effect<void, FlashTrustError>;
}

export interface FlashTrustShape {
  readonly init: (
    appName: string,
    options?: InitFlashTrustOptions,
  ) => Effect.Effect<TrustManager, FlashTrustError>;
  readonly trustOnly: (
    appName: string,
    trustedPaths: readonly string[],
    options?: InitFlashTrustOptions,
  ) => Effect.Effect<void, FlashTrustError>;
}

export class FlashTrust extends ServiceMap.Service<
  FlashTrust,
  FlashTrustShape
>()("main/FlashTrust") {}

export interface FlashPathOptions {
  readonly platform?: NodeJS.Platform;
  readonly env?: NodeJS.ProcessEnv;
  readonly homeDir?: string;
  readonly osRelease?: string;
}

export interface InitFlashTrustOptions extends FlashPathOptions {
  readonly customFolder?: string;
}

const validAppNamePattern = /^[a-zA-Z0-9-_.]+$/;

export class FlashTrustError extends Error {
  public readonly code:
    | "invalid-app-name"
    | "unsupported-platform"
    | "missing-home"
    | "create-config-dir-failed"
    | "read-config-failed"
    | "write-config-failed";
  public override readonly cause?: unknown;

  public constructor(
    message: string,
    code:
      | "invalid-app-name"
      | "unsupported-platform"
      | "missing-home"
      | "create-config-dir-failed"
      | "read-config-failed"
      | "write-config-failed",
    cause?: unknown,
  ) {
    super(message);
    this.name = "FlashTrustError";
    this.code = code;
    this.cause = cause;
  }
}

const resolveHome = (
  env: NodeJS.ProcessEnv,
  fallbackHomeDir: string,
): string => {
  const home = env["HOME"] || env["USERPROFILE"] || fallbackHomeDir;
  if (!home) {
    throw new FlashTrustError(
      "Could not resolve the current user's home directory.",
      "missing-home",
    );
  }

  return home;
};

export const getFlashPlayerFolder = (
  options: FlashPathOptions = {},
): string => {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const home = resolveHome(env, options.homeDir ?? homedir());

  if (platform === "win32") {
    const userProfile = env["USERPROFILE"] || home;
    const majorVersion = (options.osRelease ?? release()).split(".")[0];
    return majorVersion === "5"
      ? join(userProfile, "Application Data", "Macromedia", "Flash Player")
      : join(
          env["APPDATA"] || join(userProfile, "AppData", "Roaming"),
          "Macromedia",
          "Flash Player",
        );
  }

  if (platform === "darwin") {
    return join(home, "Library", "Preferences", "Macromedia", "Flash Player");
  }

  if (platform === "linux") {
    return join(home, ".macromedia", "Flash_Player");
  }

  throw new FlashTrustError(
    `Flash trust is not supported on ${platform}.`,
    "unsupported-platform",
  );
};

export const getFlashPlayerConfigFolder = (
  customFolder?: string,
  options: FlashPathOptions = {},
): string =>
  join(
    customFolder ?? getFlashPlayerFolder(options),
    "#Security",
    "FlashPlayerTrust",
  );

export const resolvePepperFlashWritableRootPath = (
  appDataDir: string,
): string => join(appDataDir, "Pepper Data", "Shockwave Flash", "WritableRoot");

export const resolvePepperFlashPluginPath = (
  workspaceDir: string,
  platform: NodeJS.Platform = process.platform,
): string | null => {
  if (platform === "darwin") {
    return join(workspaceDir, "PepperFlashPlayer.plugin");
  }

  if (platform === "win32") {
    return join(workspaceDir, "pepflashplayer.dll");
  }

  if (platform === "linux") {
    return join(workspaceDir, "libpepflashplayer.so");
  }

  return null;
};

const assertValidAppName = (appName: string): void => {
  if (!validAppNamePattern.test(appName)) {
    throw new FlashTrustError(
      "Provide a non-empty app name containing only letters, numbers, dots, hyphens, and underscores.",
      "invalid-app-name",
    );
  }
};

const readTrustedPaths = (configPath: string): string[] => {
  if (!existsSync(configPath)) {
    return [];
  }

  try {
    return readFileSync(configPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
  } catch (cause) {
    throw new FlashTrustError(
      "Could not read Flash Player trust configuration.",
      "read-config-failed",
      cause,
    );
  }
};

export const initSync = (
  appName: string,
  optionsOrCustomFolder?: InitFlashTrustOptions | string,
): SyncTrustManager => {
  assertValidAppName(appName);

  const options =
    typeof optionsOrCustomFolder === "string"
      ? { customFolder: optionsOrCustomFolder }
      : (optionsOrCustomFolder ?? {});
  const configFolder = getFlashPlayerConfigFolder(
    options.customFolder,
    options,
  );

  try {
    mkdirSync(configFolder, { recursive: true });
  } catch (cause) {
    throw new FlashTrustError(
      "Could not create Flash Player trust configuration folder.",
      "create-config-dir-failed",
      cause,
    );
  }

  const configPath = join(configFolder, `${appName}.cfg`);
  let trustedPaths = readTrustedPaths(configPath);

  const save = (): void => {
    try {
      writeFileSync(configPath, trustedPaths.join(EOL), "utf8");
    } catch (cause) {
      throw new FlashTrustError(
        "Could not write Flash Player trust configuration.",
        "write-config-failed",
        cause,
      );
    }
  };

  return {
    add: (trustedPath) => {
      if (!trustedPaths.includes(trustedPath)) {
        trustedPaths = [...trustedPaths, trustedPath];
        save();
      }
    },
    remove: (trustedPath) => {
      const nextTrustedPaths = trustedPaths.filter(
        (existingPath) => existingPath !== trustedPath,
      );
      if (nextTrustedPaths.length !== trustedPaths.length) {
        trustedPaths = nextTrustedPaths;
        save();
      }
    },
    isTrusted: (trustedPath) => trustedPaths.includes(trustedPath),
    list: () => [...trustedPaths],
    empty: () => {
      trustedPaths = [];
      save();
    },
  };
};

export const trustOnlySync = (
  appName: string,
  trustedPaths: readonly string[],
  options?: InitFlashTrustOptions,
): void => {
  const manager = initSync(appName, options);
  manager.empty();
  for (const trustedPath of trustedPaths) {
    manager.add(trustedPath);
  }
};

const toFlashTrustError = (
  cause: unknown,
  fallbackCode: FlashTrustError["code"],
  fallbackMessage: string,
): FlashTrustError =>
  cause instanceof FlashTrustError
    ? cause
    : new FlashTrustError(fallbackMessage, fallbackCode, cause);

const tryFlashTrustSync = <A>(
  trySync: () => A,
  fallbackCode: FlashTrustError["code"],
  fallbackMessage: string,
): Effect.Effect<A, FlashTrustError> =>
  Effect.try({
    try: trySync,
    catch: (cause) => toFlashTrustError(cause, fallbackCode, fallbackMessage),
  });

export const makeTrustManager = (manager: SyncTrustManager): TrustManager => ({
  add: (trustedPath) =>
    tryFlashTrustSync(
      () => manager.add(trustedPath),
      "write-config-failed",
      "Could not add Flash Player trusted path.",
    ),
  remove: (trustedPath) =>
    tryFlashTrustSync(
      () => manager.remove(trustedPath),
      "write-config-failed",
      "Could not remove Flash Player trusted path.",
    ),
  isTrusted: (trustedPath) =>
    tryFlashTrustSync(
      () => manager.isTrusted(trustedPath),
      "read-config-failed",
      "Could not inspect Flash Player trusted path.",
    ),
  list: tryFlashTrustSync(
    () => manager.list(),
    "read-config-failed",
    "Could not list Flash Player trusted paths.",
  ),
  empty: tryFlashTrustSync(
    () => manager.empty(),
    "write-config-failed",
    "Could not clear Flash Player trusted paths.",
  ),
});

export const makeFlashTrust = (): FlashTrustShape => {
  const init: FlashTrustShape["init"] = (appName, options) =>
    tryFlashTrustSync(
      () => makeTrustManager(initSync(appName, options)),
      "read-config-failed",
      "Could not initialize Flash Player trust manager.",
    );

  return {
    init,
    trustOnly: (appName, trustedPaths, options) =>
      tryFlashTrustSync(
        () => trustOnlySync(appName, trustedPaths, options),
        "write-config-failed",
        "Could not replace Flash Player trusted paths.",
      ),
  };
};

export const FlashTrustLive = Layer.succeed(FlashTrust, makeFlashTrust());
