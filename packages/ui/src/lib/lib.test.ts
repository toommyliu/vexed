import { describe, expect, it } from "vitest";
import { mergeRefs } from "./mergeRefs";

describe("mergeRefs", () => {
  it("updates function refs and object refs", () => {
    const element = document.createElement("button");
    const objectRef: { current?: HTMLButtonElement | null } = {};
    let functionRef: HTMLButtonElement | undefined;

    mergeRefs<HTMLButtonElement>(objectRef, (value) => {
      functionRef = value;
    })(element);

    expect(objectRef.current).toBe(element);
    expect(functionRef).toBe(element);
  });
});
