import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { parseCliOptions } from "./cli";

describe("CLI options", () => {
  it("parses a credentialed game launch without persisting app concepts into argv", () => {
    const cwd = "/tmp/vexed";
    const parsed = parseCliOptions(
      [
        "electron",
        "--launchMode=manager",
        "--username=Hero",
        "--password",
        "secret",
        "--server= Yorumi ",
        "--scriptPath",
        "farm.js",
        "--flash-plugin-path=plugins/libpepflashplayer.so",
      ],
      { cwd },
    );

    expect(parsed.launchMode).toBe("account-manager");
    expect(parsed.username).toBe("Hero");
    expect(parsed.password).toBe("secret");
    expect(parsed.server).toBe("Yorumi");
    expect(parsed.scriptPath).toBe(resolve(cwd, "farm.js"));
    expect(parsed.flashPluginPath).toBe(
      resolve(cwd, "plugins/libpepflashplayer.so"),
    );
  });

  it("normalizes manager launch mode aliases", () => {
    expect(
      parseCliOptions(["electron", "--launchMode", "manager"]).launchMode,
    ).toBe("account-manager");
    expect(
      parseCliOptions(["electron", "--launch-mode=manager"]).launchMode,
    ).toBe("account-manager");
  });

  it("rejects ambiguous launch arguments before startup", () => {
    expect(() =>
      parseCliOptions(["electron", "--launchMode=settings"]),
    ).toThrow("Expected game or manager");
    expect(() => parseCliOptions(["electron", "--username=Hero"])).toThrow(
      "Both --username and --password",
    );
    expect(() => parseCliOptions(["electron", "--script=farm.js"])).toThrow(
      "--script requires --username and --password",
    );
  });
});
