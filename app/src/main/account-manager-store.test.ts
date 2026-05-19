import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getAccountsPath,
  normalizeAccountManagerStorage,
  readAccountManagerStorage,
  removeGroupMemberUsername,
  renameGroupMemberUsername,
  writeAccountManagerStorage,
} from "./account-manager-store";
import * as Files from "./settings/Files";

describe("account manager storage", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-account-manager-"));
    Files.configureAppDataHome(testDir);
  });

  afterEach(async () => {
    Files.resetPathConfigurationForTests();
    await rm(testDir, { recursive: true, force: true });
  });

  it("reads object-shaped account storage", async () => {
    await writeFile(
      getAccountsPath(),
      JSON.stringify({
        accounts: [
          {
            label: "Main",
            username: "main",
            password: "secret",
          },
        ],
        groups: {
          Farm: ["main"],
        },
      }),
      "utf8",
    );

    expect(readAccountManagerStorage()).toEqual({
      accounts: [
        {
          label: "Main",
          username: "main",
          password: "secret",
        },
      ],
      groups: {
        Farm: ["main"],
      },
    });
  });

  it("does not migrate old array-shaped storage", () => {
    expect(
      normalizeAccountManagerStorage([
        {
          label: "Main",
          username: "main",
          password: "secret",
        },
      ]),
    ).toEqual({
      accounts: [],
      groups: {},
    });
  });

  it("dedupes accounts and group members while dropping unknown members", () => {
    expect(
      normalizeAccountManagerStorage({
        accounts: [
          { label: "Main", username: "main", password: "secret" },
          { label: "Duplicate", username: "MAIN", password: "secret" },
          { label: "Alt", username: "alt", password: "secret" },
        ],
        groups: {
          Farm: ["main", "main", "missing", "alt"],
          "": ["main"],
        },
      }),
    ).toEqual({
      accounts: [
        { label: "Main", username: "main", password: "secret" },
        { label: "Alt", username: "alt", password: "secret" },
      ],
      groups: {
        Farm: ["main", "alt"],
      },
    });
  });

  it("writes object-shaped account storage", async () => {
    writeAccountManagerStorage({
      accounts: [{ label: "Main", username: "main", password: "secret" }],
      groups: {
        Farm: ["main", "missing"],
      },
    });

    expect(JSON.parse(await readFile(getAccountsPath(), "utf8"))).toEqual({
      accounts: [{ label: "Main", username: "main", password: "secret" }],
      groups: {
        Farm: ["main"],
      },
    });
  });

  it("renames account usernames inside group membership", () => {
    expect(
      renameGroupMemberUsername(
        {
          Farm: ["main", "alt"],
          Boss: ["alt"],
        },
        "alt",
        "main",
      ),
    ).toEqual({
      Farm: ["main"],
      Boss: ["main"],
    });
  });

  it("removes deleted account usernames from group membership", () => {
    expect(
      removeGroupMemberUsername(
        {
          Farm: ["main", "alt"],
          Boss: ["alt"],
        },
        "alt",
      ),
    ).toEqual({
      Farm: ["main"],
      Boss: [],
    });
  });
});
