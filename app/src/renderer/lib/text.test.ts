import { describe, expect, it } from "vitest";
import { splitTextMatches } from "./text";

describe("splitTextMatches", () => {
  it("returns one non-match segment for an empty query", () => {
    expect(splitTextMatches("Alpha", "")).toEqual([
      { match: false, text: "Alpha" },
    ]);
  });

  it("marks case-insensitive matches", () => {
    expect(splitTextMatches("Alpha beta", "ALP")).toEqual([
      { match: true, text: "Alp" },
      { match: false, text: "ha beta" },
    ]);
  });

  it("splits multiple occurrences", () => {
    expect(splitTextMatches("one two one", "one")).toEqual([
      { match: true, text: "one" },
      { match: false, text: " two " },
      { match: true, text: "one" },
    ]);
  });

  it("treats regex metacharacters literally", () => {
    expect(splitTextMatches("a+b a?b", "a+b")).toEqual([
      { match: true, text: "a+b" },
      { match: false, text: " a?b" },
    ]);
  });
});
