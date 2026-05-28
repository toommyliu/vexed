import "abort-controller/polyfill";
import { randomFillSync } from "crypto";
import { app, BrowserWindow } from "electron";
import { join } from "path";
import process from "process";
import { Effect, Layer, ManagedRuntime } from "effect";
import appBranding from "../../appBranding.json";
import {
  configureGameWindow,
  getLatestAppearanceSnapshot,
  makeProgram,
  resolveDevRendererUrl,
} from "./app/MainApp";
import {
  MainEnvironment,
  MainEnvironmentLive,
  makeMainEnvironment,
  resolveUserDataPath,
  resolveWorkspaceHome,
  type MainEnvironmentConfig,
} from "./app/MainEnvironment";
import { Observability, ObservabilityLive } from "./app/MainObservability";
import { parseCliOptions } from "./cli";
import { FlashTrustLive, trustOnlySync } from "./flash/FlashTrust";
import { MainIpcLive } from "./ipc/MainIpc";
import { Persistence, PersistenceLive } from "./persistence/Persistence";
import { AccountManagerRepositoryLive } from "./persistence/accounts/AccountRepository";
import { CombatProfileRepositoryLive } from "./persistence/combatProfiles/CombatProfileRepository";
import { FastTravelRepositoryLive } from "./persistence/fastTravels/FastTravelRepository";
import {
  makeElectronWindowRuntime,
  makeWindowService,
  getRendererGameWindowPath,
  getRendererWindowPath,
  WindowService,
  type WindowManagerConfig,
} from "./window/WindowService";
import {
  SettingsService,
  SettingsServiceLive,
} from "./settings/SettingsService";
import {
  makeUpdateCacheStore,
  makeUpdateChecker,
  UpdateChecker,
  updateCacheFileName,
} from "./updates/Updates";
import { WorkspaceFilesLive } from "./workspace/WorkspaceFiles";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const SIGNAL_FORCE_EXIT_AFTER_MS = 1500;
const TERMINATION_SIGNALS = ["SIGTERM", "SIGINT", "SIGHUP"] as const;
let terminationForceExitTimer: NodeJS.Timeout | undefined;
let receivedTerminationSignal: NodeJS.Signals | null = null;

const ignoreRuntimeRejection = (promise: Promise<unknown>): void => {
  void promise.catch((cause) => {
    process.stderr.write(`Main runtime error: ${String(cause)}\n`);
  });
};

const installMainCryptoFallback = (): void => {
  if (globalThis.crypto !== undefined) {
    return;
  }

  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: <T extends ArrayBufferView>(array: T): T => {
        randomFillSync(
          Buffer.from(array.buffer, array.byteOffset, array.byteLength),
        );
        return array;
      },
    },
  });
};

installMainCryptoFallback();

const clearTerminationForceExitTimer = (): void => {
  if (!terminationForceExitTimer) {
    return;
  }

  clearTimeout(terminationForceExitTimer);
  terminationForceExitTimer = undefined;
};

const installTerminationSignalHandlers = (): void => {
  for (const signal of TERMINATION_SIGNALS) {
    process.once(signal, () => {
      if (receivedTerminationSignal !== null) {
        return;
      }

      receivedTerminationSignal = signal;
      process.stderr.write(`Received ${signal}; quitting app.\n`);
      app.quit();

      terminationForceExitTimer = setTimeout(() => {
        process.stderr.write(
          `App did not quit after ${SIGNAL_FORCE_EXIT_AFTER_MS}ms; forcing exit.\n`,
        );
        app.exit(0);
      }, SIGNAL_FORCE_EXIT_AFTER_MS);
      terminationForceExitTimer.unref?.();
    });
  }
};

const isDev = !app.isPackaged;
const isDarwin = process.platform === "darwin";
const isWin = process.platform === "win32";
const isLinux = process.platform === "linux";
const activeBranding = isDev ? appBranding.dev : appBranding.production;
const cliOptions = (() => {
  try {
    return parseCliOptions(process.argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Invalid CLI options: ${message}\n`);
    app.exit(1);
    throw error;
  }
})();

const userDataPath = resolveUserDataPath({ isDev });
app.setPath("userData", userDataPath);
app.setName(activeBranding.displayName);

if (isWin) {
  app.setAppUserModelId(activeBranding.bundleId);
}

const envConfig: MainEnvironmentConfig = {
  appDataDir: app.getPath("userData"),
  workspaceDir: resolveWorkspaceHome({
    argv: process.argv,
    documentsPath: app.getPath("documents"),
  }),
  assetsDir: join(app.getAppPath(), "..", "assets"),
  rendererDir: join(__dirname, "../renderer"),
  preloadPath: join(__dirname, "../preload/index.js"),
  ...(process.env["VEXED_DEV_RENDERER_RELOAD"] === undefined
    ? {}
    : { devRendererReloadPath: process.env["VEXED_DEV_RENDERER_RELOAD"] }),
  ...(process.env["VEXED_DEV_RENDERER_URL"] === undefined
    ? {}
    : { devRendererUrl: process.env["VEXED_DEV_RENDERER_URL"] }),
  ...(cliOptions.flashPluginPath === undefined
    ? {}
    : { flashPluginPathOverride: cliOptions.flashPluginPath }),
  isDev,
  isDarwin,
  isWin,
  isLinux,
};
const earlyEnvironment = makeMainEnvironment(envConfig);
const earlyTrustedFlashPaths = [join(earlyEnvironment.assetsDir, "loader.swf")];
const earlyFlashSetup = (() => {
  if (earlyEnvironment.flashPluginPath) {
    app.commandLine.appendSwitch(
      "ppapi-flash-path",
      earlyEnvironment.flashPluginPath,
    );
  }

  try {
    trustOnlySync("vexed", earlyTrustedFlashPaths, {
      customFolder: earlyEnvironment.flashRootPath,
    });
    return {
      status: "configured",
      flashPluginPath: earlyEnvironment.flashPluginPath,
      flashRootPath: earlyEnvironment.flashRootPath,
      trustedPaths: earlyTrustedFlashPaths,
    } as const;
  } catch (cause) {
    return {
      status: "failed",
      cause,
      flashPluginPath: earlyEnvironment.flashPluginPath,
      flashRootPath: earlyEnvironment.flashRootPath,
      trustedPaths: earlyTrustedFlashPaths,
    } as const;
  }
})();

const environmentLayer = MainEnvironmentLive(envConfig);
const baseLayer = Layer.mergeAll(environmentLayer, PersistenceLive);
const flashTrustLayer = FlashTrustLive;
const observabilityLayer = ObservabilityLive.pipe(
  Layer.provideMerge(baseLayer),
);
const settingsLayer = SettingsServiceLive.pipe(
  Layer.provideMerge(observabilityLayer),
);
const persistedDocumentsLayer = Layer.mergeAll(
  AccountManagerRepositoryLive,
  CombatProfileRepositoryLive,
  FastTravelRepositoryLive,
  WorkspaceFilesLive,
).pipe(Layer.provideMerge(observabilityLayer));
const windowLayer = Layer.effect(WindowService)(
  Effect.gen(function* () {
    const observability = yield* Observability;
    const config: WindowManagerConfig = {
      gameWindowHtmlPath: getRendererGameWindowPath(envConfig.rendererDir),
      isDev,
      preloadPath: envConfig.preloadPath,
      rendererUrl: resolveDevRendererUrl(isDev, envConfig.devRendererUrl),
      windowHtmlPath: (id) => getRendererWindowPath(envConfig.rendererDir, id),
      getAppearanceSnapshot: getLatestAppearanceSnapshot,
      onGameWindowCreated: (window) =>
        configureGameWindow(observability, window),
    };

    return makeWindowService(config, makeElectronWindowRuntime());
  }),
).pipe(Layer.provideMerge(observabilityLayer));
const updatesLayer = Layer.effect(UpdateChecker)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const persistence = yield* Persistence;
    const observability = yield* Observability;
    const settings = yield* SettingsService;
    const cacheStore = makeUpdateCacheStore({
      path: env.appDataPath(updateCacheFileName),
      readJson: persistence.readJson,
      writeJson: persistence.writeJson,
    });

    return makeUpdateChecker({
      currentVersion: app.getVersion(),
      isEnabled: () =>
        settings.get.pipe(
          Effect.map((current) => current.preferences.checkForUpdates),
          Effect.catch(() => Effect.succeed(true)),
        ),
      loadCache: cacheStore.load.pipe(
        Effect.catch((error) =>
          observability
            .warn("updates", "Failed to load update cache", { error })
            .pipe(Effect.as(null)),
        ),
      ),
      saveCache: (cache) =>
        cacheStore.save(cache).pipe(
          Effect.catch((error) =>
            observability.warn("updates", "Failed to save update cache", {
              error,
            }),
          ),
        ),
    });
  }),
).pipe(Layer.provideMerge(settingsLayer));
const ipcLayer = MainIpcLive.pipe(Layer.provideMerge(observabilityLayer));

const mainLayer = Layer.mergeAll(
  settingsLayer,
  persistedDocumentsLayer,
  windowLayer,
  updatesLayer,
  ipcLayer,
  flashTrustLayer,
);

const runtime = ManagedRuntime.make(mainLayer);

void runtime
  .runPromise(makeProgram(earlyFlashSetup, cliOptions))
  .catch((cause: unknown) => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const observability = yield* Observability;
          yield* observability.error("startup", "Main process failed", cause);
        }),
      )
      .catch(() => {
        process.stderr.write(`Main process failed: ${String(cause)}\n`);
      })
      .finally(() => {
        app.quit();
      });
  });

app.on("before-quit", () => {
  ignoreRuntimeRejection(
    runtime.runPromise(
      Effect.gen(function* () {
        const windows = yield* WindowService;
        yield* windows.setQuitting(true);
      }),
    ),
  );
});

app.on("will-quit", () => {
  clearTerminationForceExitTimer();
  ignoreRuntimeRejection(runtime.dispose());
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  ignoreRuntimeRejection(
    runtime.runPromise(
      Effect.gen(function* () {
        if (BrowserWindow.getAllWindows().length === 0) {
          const windows = yield* WindowService;
          yield* windows.revealGameWindow;
        }
      }),
    ),
  );
});

installTerminationSignalHandlers();
