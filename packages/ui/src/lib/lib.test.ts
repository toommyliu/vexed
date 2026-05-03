import { describe, expect, it } from "vitest";
import { cn } from "./cn";
import { computeCommandScore } from "./commandScore";
import { mergeRefs } from "./mergeRefs";

describe("cn", () => {
  it("filters falsey values and joins classes deterministically", () => {
    expect(cn("button", false, undefined, "button--default")).toBe(
      "button button--default",
    );
  });
});

describe("mergeRefs", () => {
  it("updates function refs and object refs", () => {
    const element = document.createElement("button");
    const objectRef: { current?: HTMLButtonElement | null } = {};
    let functionRef: HTMLButtonElement | undefined;

    mergeRefs<HTMLButtonElement>(
      objectRef,
      (value) => {
        functionRef = value;
      },
    )(element);

    expect(objectRef.current).toBe(element);
    expect(functionRef).toBe(element);
  });
});

describe("computeCommandScore", () => {
  it("scores direct and fuzzy command matches", () => {
    expect(computeCommandScore("Start process", "start")).toBeGreaterThan(0.9);
    expect(computeCommandScore("Search records", "sr")).toBeGreaterThan(0);
    expect(computeCommandScore("Bank cleanup", "zzz")).toBe(0);
  });
});
