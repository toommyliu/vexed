import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FollowerIpcChannels } from "../shared/ipc";

const readSource = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("follower IPC wiring", () => {
  it("declares typed follower IPC channels", () => {
    expect(FollowerIpcChannels.getState).toBe("follower:get-state");
    expect(FollowerIpcChannels.me).toBe("follower:me");
    expect(FollowerIpcChannels.start).toBe("follower:start");
    expect(FollowerIpcChannels.stop).toBe("follower:stop");
    expect(FollowerIpcChannels.changed).toBe("follower:changed");
    expect(FollowerIpcChannels.request).toBe("follower:request");
    expect(FollowerIpcChannels.response).toBe("follower:response");
    expect(FollowerIpcChannels.publishState).toBe("follower:publish-state");
  });

  it("exposes follower bridge methods to renderers", () => {
    const source = readSource("preload.ts");

    expect(source).toContain("follower: {");
    expect(source).toContain("getState: async");
    expect(source).toContain("me: async");
    expect(source).toContain("start: async");
    expect(source).toContain("stop: async");
    expect(source).toContain("publishState: async");
    expect(source).toContain("onGetStateRequest");
    expect(source).toContain("onStartRequest");
    expect(source).toContain("FollowerIpcChannels.request");
  });

  it("registers main follower handlers through the main entrypoint", () => {
    const indexSource = readSource("index.ts");
    const ipcSource = readSource("follower-ipc.ts");

    expect(indexSource).toContain(
      "registerFollowerIpcHandlers(runConfiguredWindowEffect)",
    );
    expect(ipcSource).toContain("FollowerIpcChannels.getState");
    expect(ipcSource).toContain("FollowerIpcChannels.start");
    expect(ipcSource).toContain("FollowerIpcChannels.stop");
    expect(ipcSource).toContain("WindowIds.Follower");
    expect(ipcSource).toContain("createIdleFollowerState");
    expect(ipcSource).toContain("normalizeFollowerState");
  });
});
