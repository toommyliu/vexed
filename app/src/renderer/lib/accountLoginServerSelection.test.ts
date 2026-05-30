import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountGameServer } from "../../shared/ipc";
import {
  readStoredAccountLoginServerPreference,
  type StoredAccountLoginServerPreference,
  resolveAccountLoginServerPreference,
  writeStoredAccountLoginServerPreference,
} from "./accountLoginServerSelection";

const STORAGE_KEY = "vexed.account-manager.login-server";

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

const makeLocalStorage = (): Storage => {
  const storage = new Map<string, string>();

  return {
    get length() {
      return storage.size;
    },
    clear: vi.fn(() => storage.clear()),
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    key: vi.fn((index: number) => [...storage.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
  };
};

describe("account login server preference storage", () => {
  let localStorage: Storage;

  beforeEach(() => {
    localStorage = makeLocalStorage();
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns undefined when no preference is stored", () => {
    const preference = readStoredAccountLoginServerPreference();

    expect(preference).toBeUndefined();
    expect(resolveAccountLoginServerPreference([server("Twilly")], preference))
      .toEqual({
        type: "server",
        name: "Twilly",
      });
  });

  it("round-trips an explicit none preference", () => {
    writeStoredAccountLoginServerPreference(null);
    const preference = readStoredAccountLoginServerPreference();

    expect(preference).toBeNull();
    expect(resolveAccountLoginServerPreference([server("Twilly")], preference))
      .toEqual({
        type: "none",
      });
  });

  it("round-trips a saved server name", () => {
    writeStoredAccountLoginServerPreference("Artix");
    const preference = readStoredAccountLoginServerPreference();

    expect(preference).toBe("Artix");
    expect(
      resolveAccountLoginServerPreference(
        [server("Twilly"), server("Artix")],
        preference,
      ),
    ).toEqual({
      type: "server",
      name: "Artix",
    });
  });

  it("returns undefined for malformed stored data", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    const preference = readStoredAccountLoginServerPreference();

    expect(preference).toBeUndefined();
    expect(resolveAccountLoginServerPreference([server("Twilly")], preference))
      .toEqual({
        type: "server",
        name: "Twilly",
      });
  });
});

describe("resolveAccountLoginServerPreference", () => {
  it("uses the saved online server when available", () => {
    expect(
      resolveAccountLoginServerPreference(
        [server("Twilly"), server("Artix")],
        "Artix",
      ),
    ).toEqual({
      type: "server",
      name: "Artix",
    });
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
    ).toEqual({
      type: "server",
      name: "Artix",
    });
  });

  it("falls back when the saved server is offline", () => {
    expect(
      resolveAccountLoginServerPreference(
        [server("Twilly"), server("Artix", { online: false })],
        "Artix",
      ),
    ).toEqual({
      type: "server",
      name: "Twilly",
    });
  });

  it("falls back when the saved server is missing", () => {
    expect(
      resolveAccountLoginServerPreference([server("Twilly")], "Artix"),
    ).toEqual({
      type: "server",
      name: "Twilly",
    });
  });

  it("returns no server for a saved explicit none preference", () => {
    expect(
      resolveAccountLoginServerPreference([server("Twilly")], null),
    ).toEqual({
      type: "none",
    });
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
    ).toEqual({
      type: "server",
      name: "Artix",
    });
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
    ).toEqual({
      type: "unavailable",
    });
  });
});
