import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(resolve(import.meta.dirname, "index.ts"), "utf8");
const windowsSource = readFileSync(
  resolve(import.meta.dirname, "windows.ts"),
  "utf8",
);
const launcherSource = readFileSync(
  resolve(import.meta.dirname, "../../scripts/start-ui-demo-electron11.mjs"),
  "utf8",
);

describe("main process dev renderer URL", () => {
  it("supports a loopback-only Vite renderer URL in development", () => {
    expect(mainSource).toContain(
      "process.env[\"VEXED_DEV_RENDERER_URL\"]",
    );
    expect(mainSource).toContain("const resolveDevRendererUrl");
    expect(mainSource).toContain("url.protocol === \"http:\"");
    expect(mainSource).toContain("url.hostname === \"127.0.0.1\"");
    expect(mainSource).toContain("url.hostname === \"localhost\"");
    expect(mainSource).toContain("rendererUrl: resolveDevRendererUrl()");
    expect(windowsSource).toContain("window.loadURL(target)");
    expect(windowsSource).toContain("config.rendererUrl");
  });

  it("uses the Vite-reported URL instead of assuming a fixed port", () => {
    expect(launcherSource).toContain("function waitForViteUrl");
    expect(launcherSource).toContain("const uiDemoUrl = await Promise.race");
    expect(launcherSource).toContain("await waitForServer(uiDemoUrl");
    expect(launcherSource).toContain("VEXED_DEV_RENDERER_URL: uiDemoUrl");
    expect(launcherSource).not.toContain("assertPortAvailable");
  });
});
