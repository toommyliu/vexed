import { describe, expect, it } from "vitest";
import type { AccountGameServer } from "../../shared/ipc";
import {
  type StoredAccountLoginServerPreference,
  resolveAccountLoginServerPreference,
} from "./accountLoginServerSelection";

const server = (
  name: string,
  options?: Partial<AccountGameServer>,
): AccountGameServer => ({
  name,
  language: "en",
  online: true,
  upgrade: false,
  playerCount: 100,
  maxPlayers: 1_000,
  ...options,
});

describe("resolveAccountLoginServerPreference", () => {
  it("uses the saved online server when available", () => {
    expect(
      resolveAccountLoginServerPreference(
        [server("Twilly"), server("Artix")],
        "Artix",
      ),
    ).toBe("Artix");
  });

  it("uses the saved online server even when full", () => {
    expect(
      resolveAccountLoginServerPreference(
        [
          server("Twilly"),
          server("Artix", { playerCount: 1_000, maxPlayers: 1_000 }),
        ],
        "Artix",
      ),
    ).toBe("Artix");
  });

  it("falls back when the saved server is offline", () => {
    expect(
      resolveAccountLoginServerPreference(
        [server("Twilly"), server("Artix", { online: false })],
        "Artix",
      ),
    ).toBe("Twilly");
  });

  it("falls back when the saved server is missing", () => {
    expect(
      resolveAccountLoginServerPreference([server("Twilly")], "Artix"),
    ).toBe("Twilly");
  });

  it("returns no server for a saved explicit none preference", () => {
    expect(
      resolveAccountLoginServerPreference([server("Twilly")], null),
    ).toBe("");
  });

  it("uses the first online non-full server without a saved preference", () => {
    expect(
      resolveAccountLoginServerPreference(
        [
          server("Offline", { online: false }),
          server("Full", { playerCount: 1_000, maxPlayers: 1_000 }),
          server("Artix"),
        ],
        undefined,
      ),
    ).toBe("Artix");
  });

  it("returns no server when no fallback is available", () => {
    const preference: StoredAccountLoginServerPreference = undefined;

    expect(
      resolveAccountLoginServerPreference(
        [
          server("Offline", { online: false }),
          server("Full", { playerCount: 1_000, maxPlayers: 1_000 }),
        ],
        preference,
      ),
    ).toBe("");
  });
});
