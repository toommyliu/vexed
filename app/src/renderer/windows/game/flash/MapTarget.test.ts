import { expect, test } from "vitest";
import { Effect } from "effect";
import { parseMapTarget, withPrivateRoom } from "./MapTarget";

const parse = (map: string) => Effect.runSync(parseMapTarget(map));

test("parseMapTarget requires the exact room only for valid fixed room suffixes", () => {
  expect(parse("battleon-48392")).toEqual({
    map: "battleon-48392",
    name: "battleon",
    roomNumber: 48_392,
    requireExactRoom: true,
  });

  expect(parse("battleon-100000")).toEqual({
    map: "battleon-100000",
    name: "battleon",
    requireExactRoom: false,
  });
});

test("parseMapTarget treats nonnumeric suffixes as part of the requested map", () => {
  expect(parse("doom-1e99")).toEqual({
    map: "doom-1e99",
    name: "doom",
    requireExactRoom: false,
  });
});

test("withPrivateRoom only adds a private room when the caller did not choose a room-like suffix", () => {
  expect(withPrivateRoom("battleon", 48_392)).toBe("battleon-48392");
  expect(withPrivateRoom(" battleon ", 48_392)).toBe("battleon-48392");
  expect(withPrivateRoom("battleon-12345", 48_392)).toBe("battleon-12345");
  expect(withPrivateRoom("doom-1e99", 48_392)).toBe("doom-1e99");
});
