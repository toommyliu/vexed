import { Effect, Layer, ServiceMap, SynchronizedRef } from "effect";
import {
  cloneDefaultFastTravels,
  normalizeFastTravels,
  type FastTravel,
} from "../../../shared/fast-travels";
import { MainEnvironment } from "../../app/MainEnvironment";
import { Observability } from "../../app/MainObservability";
import { Persistence, type PersistenceError } from "../Persistence";

export const FAST_TRAVELS_STORAGE_FILE = "fast-travels.json";

export interface FastTravelRepositoryShape {
  readonly path: string;
  readonly get: Effect.Effect<readonly FastTravel[], PersistenceError>;
  readonly set: (
    locations: readonly FastTravel[],
  ) => Effect.Effect<readonly FastTravel[], PersistenceError>;
  readonly update: (
    f: (locations: readonly FastTravel[]) => readonly FastTravel[],
  ) => Effect.Effect<readonly FastTravel[], PersistenceError>;
}

export class FastTravelRepository extends ServiceMap.Service<
  FastTravelRepository,
  FastTravelRepositoryShape
>()("main/FastTravelRepository") {}

export const FastTravelRepositoryLive = Layer.effect(FastTravelRepository)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const persistence = yield* Persistence;
    const observability = yield* Observability;
    const path = env.appDataPath(FAST_TRAVELS_STORAGE_FILE);
    const ref = yield* SynchronizedRef.make<readonly FastTravel[] | null>(null);
    const defaults = (): readonly FastTravel[] => cloneDefaultFastTravels();

    const load = Effect.gen(function* () {
      const result = yield* persistence.readJson(path);
      if (result.status === "missing") {
        return defaults();
      }

      if (result.status === "malformed") {
        const quarantinePath = yield* persistence.quarantineMalformed(
          path,
          result.error.message,
        );
        yield* observability.warn(
          "fast-travels",
          "Malformed fast travel storage file",
          { path, quarantinePath, error: result.error },
        );
        const fallback = defaults();
        yield* persistence.writeJson(path, fallback);
        return fallback;
      }

      return normalizeFastTravels(result.value);
    });

    const get = SynchronizedRef.modifyEffect(ref, (current) =>
      (current === null ? load : Effect.succeed(current)).pipe(
        Effect.map((locations) => [locations, locations] as const),
      ),
    );

    const set = (locations: readonly FastTravel[]) =>
      SynchronizedRef.modifyEffect(ref, () =>
        Effect.gen(function* () {
          const normalized = normalizeFastTravels(locations);
          yield* persistence.writeJson(path, normalized);
          return [normalized, normalized] as const;
        }),
      );

    const update = (
      f: (locations: readonly FastTravel[]) => readonly FastTravel[],
    ) =>
      SynchronizedRef.modifyEffect(ref, (current) =>
        Effect.gen(function* () {
          const base = current ?? (yield* load);
          const normalized = normalizeFastTravels(f(base));
          yield* persistence.writeJson(path, normalized);
          return [normalized, normalized] as const;
        }),
      );

    return { path, get, set, update };
  }),
);
