import { Effect, Random } from "effect";

export const MIN_RANDOM_ROOM_NUMBER = 10_000;
export const MAX_FIXED_ROOM_NUMBER = 99_999;

export interface MapTarget {
  readonly map: string;
  readonly name: string;
  readonly roomNumber?: number;
  readonly requireExactRoom: boolean;
}

export const hasExplicitRoomSuffix = (map: string): boolean => {
  const trimmed = map.trim();
  const separatorIndex = trimmed.indexOf("-");
  return separatorIndex > 0 && separatorIndex < trimmed.length - 1;
};

export const withPrivateRoom = (map: string, roomNumber: number): string => {
  const trimmed = map.trim();
  return hasExplicitRoomSuffix(trimmed) ? trimmed : `${trimmed}-${roomNumber}`;
};

export const randomPrivateRoomNumber = (): Effect.Effect<number> =>
  Random.nextIntBetween(MIN_RANDOM_ROOM_NUMBER, MAX_FIXED_ROOM_NUMBER);

export const parseMapTarget = (map: string): Effect.Effect<MapTarget> =>
  Effect.sync(() => {
    const trimmed = map.trim();
    const separatorIndex = trimmed.indexOf("-");
    if (separatorIndex === -1) {
      return { map: trimmed, name: trimmed, requireExactRoom: false };
    }

    const name = trimmed.slice(0, separatorIndex);
    const roomToken = trimmed.slice(separatorIndex + 1);

    if (/^\d+$/.test(roomToken)) {
      const roomNumber = Number(roomToken);
      if (
        Number.isSafeInteger(roomNumber) &&
        roomNumber <= MAX_FIXED_ROOM_NUMBER
      ) {
        return {
          map: trimmed,
          name,
          roomNumber,
          requireExactRoom: true,
        };
      }
    }

    return {
      map: trimmed,
      name,
      requireExactRoom: false,
    };
  });
