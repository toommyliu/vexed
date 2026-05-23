import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PacketsIpcChannels } from "../shared/ipc";

const readSource = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("packets IPC wiring", () => {
  it("declares typed packet IPC channels", () => {
    expect(PacketsIpcChannels.startCapture).toBe("packets:start-capture");
    expect(PacketsIpcChannels.stopCapture).toBe("packets:stop-capture");
    expect(PacketsIpcChannels.send).toBe("packets:send");
    expect(PacketsIpcChannels.startQueue).toBe("packets:start-queue");
    expect(PacketsIpcChannels.stopQueue).toBe("packets:stop-queue");
    expect(PacketsIpcChannels.captured).toBe("packets:captured");
    expect(PacketsIpcChannels.status).toBe("packets:status");
    expect(PacketsIpcChannels.request).toBe("packets:request");
    expect(PacketsIpcChannels.response).toBe("packets:response");
  });

  it("exposes packet bridge methods to renderers", () => {
    const source = readSource("preload.ts");

    expect(source).toContain("packets: {");
    expect(source).toContain("startCapture: async");
    expect(source).toContain("stopCapture: async");
    expect(source).toContain("startQueue: async");
    expect(source).toContain("stopQueue: async");
    expect(source).toContain("publishCaptured: async");
    expect(source).toContain("publishStatus: async");
    expect(source).toContain("onCaptured");
    expect(source).toContain("onStatus");
    expect(source).toContain("onRequest");
  });

  it("registers main packet handlers through the main entrypoint", () => {
    const indexSource = readSource("index.ts");
    const ipcSource = readSource("packets-ipc.ts");

    expect(indexSource).toContain(
      "registerPacketsIpcHandlers(runConfiguredWindowEffect)",
    );
    expect(ipcSource).toContain("PacketsIpcChannels.startCapture");
    expect(ipcSource).toContain("PacketsIpcChannels.publishCaptured");
    expect(ipcSource).toContain("PacketsIpcChannels.publishStatus");
    expect(ipcSource).toContain("WindowIds.Packets");
    expect(ipcSource).toContain("isPacketSendTarget");
  });
});
