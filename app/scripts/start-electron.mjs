import { spawn } from "node:child_process";

import { appDir, resolveElectronPath } from "./electron-launcher.mjs";

const FORCE_KILL_AFTER_MS = 1_500;
const TERMINATION_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"];

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(resolveElectronPath(), ["."], {
  cwd: appDir,
  env,
  stdio: "inherit",
});

let requestedSignal;
let forceKillTimer;

const hasChildExited = () => child.exitCode !== null || child.signalCode !== null;

const clearForceKillTimer = () => {
  if (forceKillTimer) {
    clearTimeout(forceKillTimer);
    forceKillTimer = undefined;
  }
};

const removeSignalHandlers = () => {
  for (const [signal, handler] of signalHandlers) {
    process.off(signal, handler);
  }
  signalHandlers.clear();
};

const forwardTerminationSignal = (signal) => {
  requestedSignal ??= signal;

  if (hasChildExited()) {
    return;
  }

  child.kill(signal);

  if (!forceKillTimer) {
    forceKillTimer = setTimeout(() => {
      if (!hasChildExited()) {
        child.kill("SIGKILL");
      }
    }, FORCE_KILL_AFTER_MS);
    forceKillTimer.unref?.();
  }
};

const signalHandlers = new Map(
  TERMINATION_SIGNALS.map((signal) => [
    signal,
    () => forwardTerminationSignal(signal),
  ]),
);

for (const [signal, handler] of signalHandlers) {
  process.once(signal, handler);
}

process.once("exit", () => {
  if (!hasChildExited()) {
    child.kill("SIGTERM");
  }
});

child.on("exit", (code, signal) => {
  clearForceKillTimer();
  removeSignalHandlers();

  if (requestedSignal) {
    process.kill(process.pid, requestedSignal);
    return;
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
