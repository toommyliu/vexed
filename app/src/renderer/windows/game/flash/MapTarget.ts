import { Effect, Random } from "effect";

export const MIN_RANDOM_ROOM_NUMBER = 10_000;
export const MAX_FIXED_ROOM_NUMBER = 99_999;

export interface MapTarget {
  readonly map: string;
  readonly name: string;
  readonly roomNumber?: number;
  readonly requireExactRoom: boolean;
}

const splitMapRoomSuffix = (
  map: string,
): { readonly name: string; readonly roomToken?: string } => {
  const trimmed = map.trim();
  const separatorIndex = trimmed.indexOf("-");
  if (separatorIndex <= 0 || separatorIndex >= trimmed.length - 1) {
    return { name: trimmed };
  }

  return {
    name: trimmed.slice(0, separatorIndex),
    roomToken: trimmed.slice(separatorIndex + 1),
  };
};

const parseFixedRoomNumber = (roomToken: string): number | undefined => {
  if (!/^\d+$/.test(roomToken)) {
    return undefined;
  }

  const roomNumber = Number(roomToken);
  return Number.isSafeInteger(roomNumber) && roomNumber <= MAX_FIXED_ROOM_NUMBER
    ? roomNumber
    : undefined;
};

export const hasExplicitRoomSuffix = (map: string): boolean => {
  const { roomToken } = splitMapRoomSuffix(map);
  return (
    roomToken !== undefined && parseFixedRoomNumber(roomToken) !== undefined
  );
};

export const withPrivateRoom = (map: string, roomNumber: number): string => {
  const target = splitMapRoomSuffix(map);
  return target.roomToken !== undefined &&
    parseFixedRoomNumber(target.roomToken) !== undefined
    ? map.trim()
    : `${target.name}-${roomNumber}`;
};

export const randomPrivateRoomNumber = (): Effect.Effect<number> =>
  Random.nextIntBetween(MIN_RANDOM_ROOM_NUMBER, MAX_FIXED_ROOM_NUMBER);

export const parseMapTarget = (map: string): Effect.Effect<MapTarget> =>
  Effect.gen(function* () {
    const trimmed = map.trim();
    const separatorIndex = trimmed.indexOf("-");
    if (separatorIndex === -1) {
      return { map: trimmed, name: trimmed, requireExactRoom: false };
    }

    const name = trimmed.slice(0, separatorIndex);
    const roomToken = trimmed.slice(separatorIndex + 1);
    const roomNumber = parseFixedRoomNumber(roomToken);

    if (roomNumber !== undefined) {
      return {
        map: trimmed,
        name,
        roomNumber,
        requireExactRoom: true,
      };
    }

    const randomRoomNumber = yield* randomPrivateRoomNumber();
    return {
      map: withPrivateRoom(name, randomRoomNumber),
      name,
      roomNumber: randomRoomNumber,
      requireExactRoom: true,
    };
  });
