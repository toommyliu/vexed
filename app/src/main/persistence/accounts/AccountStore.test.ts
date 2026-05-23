import { describe, expect, it } from "vitest";
import {
  normalizeAccountManagerStorage,
  removeGroupMemberUsername,
  renameGroupMemberUsername,
  serializeAccountManagerStorage,
} from "./AccountStore";

describe("account manager storage", () => {
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

  it("serializes normalized account storage for persistence", () => {
    expect(
      serializeAccountManagerStorage({
        accounts: [{ label: "Main", username: "main", password: "secret" }],
        groups: {
          Farm: ["main", "missing"],
        },
      }),
    ).toEqual({
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
