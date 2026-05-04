import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WindowIpcChannels } from "../shared/ipc";
import { WindowIds } from "../shared/windows";

const readSource = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("app window wiring", () => {
  it("registers a typed IPC handler and opens windows through the service runner", () => {
    const source = readSource("window-ipc.ts");

    expect(WindowIpcChannels.open).toBe("windows:open");
    expect(source).toContain("ipcMain.handle(WindowIpcChannels.open");
    expect(source).toContain("isWindowId(id)");
    expect(source).toContain("BrowserWindow.fromWebContents(event.sender)?.id");
    expect(source).toContain("runWindowEffect");
    expect(source).toContain("windows.openWindow(id, senderWindowId)");
  });

  it("exposes the window IPC bridge to renderers", () => {
    const source = readSource("preload.ts");

    expect(source).toContain("WindowIpcChannels.open");
    expect(source).toContain("windows: {");
    expect(source).toContain("open: async (id: WindowId)");
    expect(source).toContain("ipcRenderer.invoke(WindowIpcChannels.open, id)");
  });

  it("builds app-specific native menu items from the shared catalog", () => {
    const source = readSource("menu.ts");

    expect(source).toContain("label: app.name");
    expect(source).toContain("label: \"Check for Updates...\"");
    expect(source).toContain("WindowIds.AccountManager");
    expect(source).toContain("WindowIds.Settings");
    expect(source).toContain("Menu.setApplicationMenu");
  });

  it("uses the game catalog for the game topnav window menu", () => {
    const source = readSource("../renderer/windows/game/GameApp.tsx");

    expect(source).toContain("gameWindowGroups");
    expect(source).toContain("window.ipc.windows.open(id)");
    expect(source).toContain("onSelect={() => openWindow(item.id)}");
  });

  it("loads child windows with their window id in the renderer URL", () => {
    const source = readSource("windows.ts");

    expect(source).toContain(
      "pathToFileURL(config.windowHtmlPath(definition.id))",
    );
    expect(source).toContain("getRendererWindowPath");
    expect(source).toContain(
      "entry.childWindows.set(definition.id, childWindow)",
    );
    expect(source).toContain("parentGameWindowIds.set");
    expect(source).toContain("getWindowDefinition");
    expect(source).toContain("isAppWindowDefinition");
    expect(source).toContain("isGameChildWindowDefinition");
    expect(source).toContain("openAppWindow");
  });

  it("destroys game child windows when the game window closes", () => {
    const source = readSource("windows.ts");

    expect(source).toContain("window.on(\"close\", () => {");
    expect(source).toContain("destroyChildWindows(entry)");
    expect(source).toContain("forceClosingWindowIds");
    expect(source).toContain("childWindow.destroy()");
    expect(source).toContain(
      "if (isQuitting || forceClosingWindowIds.has(childWindowId))",
    );
  });

  it("lets hidden-on-close windows close during app quit", () => {
    const windowSource = readSource("windows.ts");
    const indexSource = readSource("index.ts");

    expect(windowSource).toContain("let isQuitting = false");
    expect(windowSource).toContain("setQuitting: (quitting)");
    expect(windowSource).toContain("if (isQuitting)");
    expect(indexSource).toContain("app.on(\"before-quit\"");
    expect(indexSource).toContain("windows.setQuitting(true)");
  });

  it("declares each SolidJS view as an individual renderer target", () => {
    const source = readFileSync(
      resolve(import.meta.dirname, "../../esbuild.config.js"),
      "utf8",
    );
    const windowHtml = readSource("../renderer/windows/index.html");
    const windowIds = Object.values(WindowIds);

    expect(source).toContain("const solidRendererTargets");
    expect(source).toContain("name: \"game\"");
    expect(source).toContain(
      "entryPoint: \"./src/renderer/windows/game/app.tsx\"",
    );
    expect(source).toContain("html: \"src/renderer/windows/game/index.html\"");
    expect(source).not.toContain("window-view");
    expect(source).toContain("html: \"src/renderer/windows/index.html\"");
    expect(source).toContain("outDir: `dist/renderer/${target.name}`");
    expect(source).toContain("target: `dist/renderer/${target.name}/index.html`");

    for (const id of windowIds) {
      expect(source).toContain(`name: "${id}"`);
      expect(source).toContain(
        `entryPoint: "./src/renderer/windows/${id}/app.tsx"`,
      );
      expect(
        existsSync(
          resolve(import.meta.dirname, `../renderer/windows/${id}/app.tsx`),
        ),
      ).toBe(true);
    }

    expect(source).toContain("createRendererBuildOptions()");
    expect(source).toContain("entryPoints: rendererEntryPoints");
    expect(windowHtml).toContain(
      '<link rel="stylesheet" href="./index.css" />',
    );
  });
});
