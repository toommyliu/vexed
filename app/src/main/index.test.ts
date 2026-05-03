import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(resolve(import.meta.dirname, "index.ts"), "utf8");
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
    expect(mainSource).toContain("win.loadURL(rendererUrl)");
  });

  it("passes strict Vite port flags through pnpm without an extra argument separator", () => {
    expect(launcherSource).toContain("const uiDemoPort = 4173");
    expect(launcherSource).toContain("\"--port\", String(uiDemoPort)");
    expect(launcherSource).toContain("\"--strictPort\"");
    expect(launcherSource).not.toContain(
      "[\"--dir\", uiDir, \"demo\", \"--\", \"--port\"",
    );
  });

  it("checks the fixed Vite port before launching Electron", () => {
    expect(launcherSource).toContain("import { createServer } from \"node:net\"");
    expect(launcherSource).toContain("function assertPortAvailable");
    expect(launcherSource).toContain(
      "await assertPortAvailable(uiDemoHost, uiDemoPort)",
    );
  });
});
