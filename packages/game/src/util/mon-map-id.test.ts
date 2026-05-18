import { describe, expect, it } from "vitest";
import { parseMonsterMapIdToken } from "./mon-map-id";

describe("parseMonsterMapIdToken", () => {
  it("parses positive numeric ids and prefixed id strings", () => {
    expect(parseMonsterMapIdToken(2)).toBe(2);
    expect(parseMonsterMapIdToken(2.9)).toBe(2);
    expect(parseMonsterMapIdToken("id:3")).toBe(3);
    expect(parseMonsterMapIdToken("id.4")).toBe(4);
    expect(parseMonsterMapIdToken("id-5")).toBe(5);
    expect(parseMonsterMapIdToken("id'6")).toBe(6);
  });

  it("ignores names and malformed ids", () => {
    expect(parseMonsterMapIdToken("Ultra Boss")).toBeUndefined();
    expect(parseMonsterMapIdToken("id:Boss")).toBeUndefined();
    expect(parseMonsterMapIdToken("id:3abc")).toBeUndefined();
    expect(parseMonsterMapIdToken("id:3.5")).toBeUndefined();
    expect(parseMonsterMapIdToken("id:003x")).toBeUndefined();
    expect(parseMonsterMapIdToken(0)).toBeUndefined();
    expect(parseMonsterMapIdToken(-1)).toBeUndefined();
  });
});
