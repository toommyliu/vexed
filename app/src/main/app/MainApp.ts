import { unwatchFile, watchFile, promises, type Stats } from "fs";
import {
  app,
  BrowserWindow,
  nativeTheme,
  session,
  type BrowserWindow as ElectronBrowserWindow,
} from "electron";
import { Effect, Scope, ServiceMap } from "effect";
import { createAppearanceSnapshot } from "../../shared/appearance-snapshot";
import type { Appearance } from "../../shared/settings";
import { WindowIds } from "../../shared/windows";
import {
  getArtixLauncherRequestHeaders,
  getArtixLauncherUserAgent,
} from "../artix-launcher-headers";
import type { CliOptions } from "../cli";
import { installMainIpcHandlers } from "../ipc/MainIpcHandlers";
import { startAccountGameLaunch } from "../ipc/methods/accounts";
import { AccountManagerRepository } from "../persistence/accounts/AccountRepository";
import { createApplicationMenu } from "../window/ApplicationMenu";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "../window/WindowService";
import { MainEnvironment } from "./MainEnvironment";
import { Observability, type ObservabilityShape } from "./MainObservability";
import { SettingsService } from "../settings/SettingsService";
import { UpdateChecker } from "../updates/Updates";
import { WorkspaceFiles } from "../workspace/WorkspaceFiles";

const gameUserAgent = getArtixLauncherUserAgent();

let latestAppearance: Appearance | null = null;

export type EarlyFlashSetupResult =
  | {
      readonly status: "configured";
      readonly flashPluginPath: string | null;
      readonly flashRootPath: string;
      readonly trustedPaths: readonly string[];
    }
  | {
      readonly status: "failed";
      readonly cause: unknown;
      readonly flashPluginPath: string | null;
      readonly flashRootPath: string;
      readonly trustedPaths: readonly string[];
    };

const installGameRequestHeaders = (): void => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = details.requestHeaders;
    for (const [name, value] of Object.entries(
      getArtixLauncherRequestHeaders(),
    )) {
      requestHeaders[name] = value;
    }
    callback({ requestHeaders, cancel: false });
  });
};

const installDevRendererReloadWatcher = (
  reloadPath: string | undefined,
): Effect.Effect<void, never, Scope.Scope> =>
  Effect.gen(function* () {
    if (!reloadPath) {
      return;
    }

    const listener = (current: Stats, previous: Stats) => {
      if (
        current.mtimeMs === previous.mtimeMs &&
        current.size === previous.size
      ) {
        return;
      }

      if (current.mtimeMs === 0) {
        return;
      }

      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
          win.webContents.reloadIgnoringCache();
        }
      }
    };

    yield* Effect.acquireRelease(
      Effect.sync(() => {
        watchFile(reloadPath, { interval: 250 }, listener);
      }),
      () =>
        Effect.sync(() => {
          unwatchFile(reloadPath, listener);
        }),
    );
  });

const installDevDockIcon = (
  isDev: boolean,
  isDarwin: boolean,
  iconPath: string,
): void => {
  if (!isDev || !isDarwin) {
    return;
  }

  app.dock.setIcon(iconPath);
};

const clearAppData = (): Promise<void> =>
  Promise.all([
    session.defaultSession.clearCache(),
    session.defaultSession.clearStorageData(),
  ]).then(() => undefined);

const removeDirectory = async (path: string): Promise<void> => {
  if (typeof promises.rm === "function") {
    await promises.rm(path, { recursive: true, force: true });
    return;
  }

  await promises.rmdir(path, { recursive: true }).catch((cause: unknown) => {
    if ((cause as NodeJS.ErrnoException).code !== "ENOENT") {
      throw cause;
    }
  });
};

const clearFlashData = (flashRootPath: string): Promise<void> =>
  removeDirectory(flashRootPath);

const makeWindowEffectRunner = (
  services: ServiceMap.ServiceMap<WindowService>,
): WindowEffectRunner => {
  const runPromise = Effect.runPromiseWith(services);
  return <A>(effect: Effect.Effect<A, WindowManagerError, WindowService>) =>
    runPromise(effect);
};

export const makeProgram = (
  earlyFlashSetup?: EarlyFlashSetupResult,
  cliOptions: CliOptions = {},
) =>
  Effect.scoped(
    Effect.gen(function* () {
      const env = yield* MainEnvironment;
      const observability = yield* Observability;
      const settings = yield* SettingsService;
      const updates = yield* UpdateChecker;

      yield* observability.installProcessHooks;
      yield* observability.info("startup", "Main process starting", {
        appDataDir: env.appDataDir,
        workspaceDir: env.workspaceDir,
        version: app.getVersion(),
      });

      if (earlyFlashSetup?.status === "configured") {
        yield* observability.info("startup", "Flash support configured", {
          flashPluginPath: earlyFlashSetup.flashPluginPath,
          flashRootPath: earlyFlashSetup.flashRootPath,
          trustedPaths: earlyFlashSetup.trustedPaths,
        });
      } else if (earlyFlashSetup?.status === "failed") {
        yield* observability.error(
          "startup",
          "Flash support setup failed",
          earlyFlashSetup.cause,
          {
            flashPluginPath: earlyFlashSetup.flashPluginPath,
            flashRootPath: earlyFlashSetup.flashRootPath,
            trustedPaths: earlyFlashSetup.trustedPaths,
          },
        );
      }

      const loadedSettings = yield* settings.load;
      yield* settings.installNativeThemeChangeBroadcast;
      latestAppearance = loadedSettings.appearance;
      yield* settings.onChanged((nextSettings) => {
        latestAppearance = nextSettings.appearance;
      });

      const services = yield* Effect.services<WindowService>();
      const runWindowEffect = makeWindowEffectRunner(services);

      yield* installMainIpcHandlers(runWindowEffect);
      yield* installDevRendererReloadWatcher(env.devRendererReloadPath);

      yield* Effect.promise(() => app.whenReady());
      yield* observability.info("startup", "Electron app ready");

      installGameRequestHeaders();
      installDevDockIcon(env.isDev, env.isDarwin, env.appIconPath);

      yield* createApplicationMenuEffect(runWindowEffect);

      const windowService = yield* WindowService;
      const cliUsername = cliOptions.username;
      const cliPassword = cliOptions.password;
      if (cliUsername !== undefined && cliPassword !== undefined) {
        const repository = yield* AccountManagerRepository;
        const workspace = yield* WorkspaceFiles;
        const script =
          cliOptions.scriptPath === undefined
            ? null
            : yield* workspace.readScript(cliOptions.scriptPath);

        yield* Effect.promise(() =>
          startAccountGameLaunch(
            {
              account: {
                label: cliUsername,
                username: cliUsername,
                password: cliPassword,
              },
              script,
              ...(cliOptions.server === undefined
                ? {}
                : { server: cliOptions.server }),
            },
            {
              runWindowEffect,
              repository,
              workspace,
              observability,
            },
          ),
        );
      } else if (
        (cliOptions.launchMode ?? loadedSettings.preferences.launchMode) ===
        "account-manager"
      ) {
        yield* windowService.openWindow(WindowIds.AccountManager);
      } else {
        yield* windowService.revealGameWindow();
      }

      yield* updates.checkNow();

      yield* Effect.addFinalizer(() =>
        windowService.setQuitting(true).pipe(
          Effect.flatMap(() =>
            observability.info("shutdown", "Main process stopped"),
          ),
          Effect.asVoid,
        ),
      );

      return yield* Effect.never;
    }),
  );

const createApplicationMenuEffect = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<
  void,
  never,
  MainEnvironment | Observability | SettingsService | UpdateChecker
> =>
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const observability = yield* Observability;
    const settings = yield* SettingsService;
    const updates = yield* UpdateChecker;
    const services = yield* Effect.services<
      Observability | SettingsService | UpdateChecker
    >();
    const runPromise = Effect.runPromiseWith(services);

    yield* Effect.promise(() =>
      createApplicationMenu({
        runWindowEffect,
        getSettings: () => runPromise(settings.get),
        updateAppearance: (patch) =>
          runPromise(settings.updateAppearance(patch)),
        checkForUpdates: () => runPromise(updates.checkNow({ force: true })),
        clearAppData,
        clearFlashData: () => clearFlashData(env.flashRootPath),
        logError: (component, message, error, data) => {
          void runPromise(
            observability.error(component, message, error, data),
          ).catch(() => undefined);
        },
        onSettingsChanged: async (listener) =>
          runPromise(
            settings.onChanged(() => {
              listener();
            }),
          ),
      }),
    );
  });

export const getLatestAppearanceSnapshot = () => {
  if (latestAppearance === null) {
    throw new Error("Settings have not been loaded");
  }

  return createAppearanceSnapshot(
    latestAppearance,
    nativeTheme.shouldUseDarkColors,
  );
};

export const configureGameWindow = (
  observability: ObservabilityShape,
  win: ElectronBrowserWindow,
): void => {
  win.webContents.setUserAgent(gameUserAgent);
  void Effect.runPromise(
    observability.observeWindow(win, {
      source: "game",
      component: `game-window:${win.id}`,
    }),
  ).catch(() => undefined);
};
