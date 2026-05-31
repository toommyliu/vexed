import { homedir } from "os";
import { isAbsolute, join, resolve } from "path";
import { Layer, ServiceMap } from "effect";
import appBranding from "../../../appBranding.json";
import {
  resolvePepperFlashPluginPath,
  resolvePepperFlashWritableRootPath,
} from "../flash/FlashTrust";

export interface MainEnvironmentConfig {
  readonly appDataDir: string;
  readonly workspaceDir: string;
  readonly assetsDir: string;
  readonly rendererDir: string;
  readonly preloadPath: string;
  readonly flashPluginPathOverride?: string;
  readonly devRendererReloadPath?: string;
  readonly isDev: boolean;
  readonly isDarwin: boolean;
  readonly isWin: boolean;
  readonly isLinux: boolean;
}

export interface MainEnvironmentShape extends MainEnvironmentConfig {
  readonly appDataPath: (...parts: readonly string[]) => string;
  readonly workspacePath: (...parts: readonly string[]) => string;
  readonly appIconPath: string;
  readonly logsDir: string;
  readonly flashRootPath: string;
  readonly flashPluginPath: string | null;
  readonly armyConfigPath: (configName: string) => string;
  readonly scriptsDir: string;
}

export class MainEnvironment extends ServiceMap.Service<
  MainEnvironment,
  MainEnvironmentShape
>()("main/MainEnvironment") {}

const normalizePath = (path: string): string => {
  const trimmed = path.trim();
  if (trimmed.startsWith("~/") || trimmed === "~") {
    return join(homedir(), trimmed.slice(1));
  }

  return isAbsolute(trimmed) ? trimmed : resolve(trimmed);
};

const readConfiguredPath = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? normalizePath(trimmed) : undefined;
};

const readVexedHomeArg = (
  argv: readonly string[] = process.argv,
): string | undefined => {
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === undefined) {
      continue;
    }

    if (arg.startsWith("--vexed-home=")) {
      return readConfiguredPath(arg.slice("--vexed-home=".length));
    }

    if (arg === "--vexed-home") {
      return readConfiguredPath(argv[index + 1]);
    }
  }

  return undefined;
};

export const resolveWorkspaceHome = (
  options: {
    readonly argv?: readonly string[];
    readonly env?: NodeJS.ProcessEnv;
    readonly documentsPath?: string;
  } = {},
): string => {
  const env = options.env ?? process.env;
  const documentsPath = options.documentsPath ?? join(homedir(), "Documents");

  return (
    readVexedHomeArg(options.argv) ??
    readConfiguredPath(env["VEXED_HOME"]) ??
    join(documentsPath, "vexed")
  );
};

export const resolveAppDataBasePath = (
  platform: NodeJS.Platform = process.platform,
): string =>
  platform === "win32"
    ? process.env["APPDATA"] || join(homedir(), "AppData", "Roaming")
    : platform === "darwin"
      ? join(homedir(), "Library", "Application Support")
      : process.env["XDG_CONFIG_HOME"] || join(homedir(), ".config");

export const resolveUserDataPath = (options: {
  readonly isDev: boolean;
  readonly platform?: NodeJS.Platform;
}): string => {
  const activeBranding = options.isDev
    ? appBranding.dev
    : appBranding.production;
  return join(
    resolveAppDataBasePath(options.platform),
    activeBranding.userDataDirName,
  );
};

export const makeMainEnvironment = (
  config: MainEnvironmentConfig,
): MainEnvironmentShape => {
  const appDataPath = (...parts: readonly string[]) =>
    join(config.appDataDir, ...parts);
  const workspacePath = (...parts: readonly string[]) =>
    join(config.workspaceDir, ...parts);
  const platform: NodeJS.Platform = config.isDarwin
    ? "darwin"
    : config.isWin
      ? "win32"
      : config.isLinux
        ? "linux"
        : process.platform;

  return {
    ...config,
    appDataPath,
    workspacePath,
    appIconPath: join(
      config.assetsDir,
      (config.isDev ? appBranding.dev : appBranding.production).iconPng,
    ),
    logsDir: appDataPath("logs"),
    flashRootPath: resolvePepperFlashWritableRootPath(config.appDataDir),
    flashPluginPath:
      config.flashPluginPathOverride ??
      resolvePepperFlashPluginPath(config.workspaceDir, platform),
    armyConfigPath: (configName) => workspacePath("army", `${configName}.yaml`),
    scriptsDir: workspacePath("scripts"),
  };
};

export const MainEnvironmentLive = (config: MainEnvironmentConfig) =>
  Layer.succeed(MainEnvironment, makeMainEnvironment(config));
