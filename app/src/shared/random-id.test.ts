import { describe, expect, it } from "vitest";
import { makeRandomId, RandomIdUnavailableError } from "./random-id";

describe("shared random ids", () => {
  it("uses randomUUID when available", () => {
    expect(
      makeRandomId({
        randomUUID: () => "stable-uuid",
      }),
    ).toBe("stable-uuid");
  });

  it("falls back to getRandomValues when randomUUID is unavailable", () => {
    expect(
      makeRandomId({
        getRandomValues: (array) => {
          const bytes = array as unknown as Uint8Array;
          bytes.fill(10);
          return array;
        },
      }),
    ).toBe("0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a");
  });

  it("fails when secure random ids are unavailable", () => {
    expect(() => makeRandomId({})).toThrow(RandomIdUnavailableError);
  });
});
