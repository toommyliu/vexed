import { expect, test } from "vitest";
import { Effect } from "effect";
import {
  MAX_FIXED_ROOM_NUMBER,
  MIN_RANDOM_ROOM_NUMBER,
  parseMapTarget,
  withPrivateRoom,
} from "./MapTarget";

const parse = (map: string) => Effect.runSync(parseMapTarget(map));
const expectRandomPrivateRoomTarget = (
  target: ReturnType<typeof parse>,
  name: string,
) => {
  expect(target.name).toBe(name);
  expect(target.requireExactRoom).toBe(true);
  expect(target.roomNumber).toEqual(expect.any(Number));
  expect(target.roomNumber).toBeGreaterThanOrEqual(MIN_RANDOM_ROOM_NUMBER);
  expect(target.roomNumber).toBeLessThanOrEqual(MAX_FIXED_ROOM_NUMBER);
  expect(target.map).toBe(`${name}-${target.roomNumber}`);
};

test("parseMapTarget requires the exact room only for valid fixed room suffixes", () => {
  expect(parse("battleon-48392")).toEqual({
    map: "battleon-48392",
    name: "battleon",
    roomNumber: 48_392,
    requireExactRoom: true,
  });

  expectRandomPrivateRoomTarget(parse("battleon-100000"), "battleon");
});

test("parseMapTarget treats nonnumeric suffixes as private-room shorthand", () => {
  expectRandomPrivateRoomTarget(parse("doom-1e99"), "doom");
});

test("withPrivateRoom only adds a private room when the caller did not choose a room-like suffix", () => {
  expect(withPrivateRoom("battleon", 48_392)).toBe("battleon-48392");
  expect(withPrivateRoom(" battleon ", 48_392)).toBe("battleon-48392");
  expect(withPrivateRoom("battleon-12345", 48_392)).toBe("battleon-12345");
  expect(withPrivateRoom("doom-1e99", 48_392)).toBe("doom-48392");
});
