import { spawn } from "node:child_process";

import { appDir, resolveElectronPath } from "./electron-launcher.mjs";

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(resolveElectronPath(), ["."], {
  cwd: appDir,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
